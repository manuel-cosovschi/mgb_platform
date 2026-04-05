import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, image: true } } } },
      labels: { include: { label: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      attachments: true,
      checklistItems: { orderBy: { order: "asc" } },
      subtasks: {
        include: {
          assignments: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      },
      blockedBy: { include: { blocker: { select: { id: true, title: true, status: true } } } },
      project: { select: { id: true, name: true, slug: true } },
      column: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      timeEntries: { where: { userId: session.user.id }, orderBy: { startTime: "desc" }, take: 5 },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const oldTask = await db.task.findUnique({ where: { id } });
  if (!oldTask) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { assigneeIds, labelIds, ...data } = body;

  const task = await db.$transaction(async (tx) => {
    // Update base fields
    const updated = await tx.task.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.status === "DONE" && !oldTask.completedAt ? new Date() : data.status !== "DONE" ? null : undefined,
      },
    });

    // Update assignments if provided
    if (assigneeIds !== undefined) {
      await tx.taskAssignment.deleteMany({ where: { taskId: id } });
      if (assigneeIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: assigneeIds.map((userId: string) => ({ taskId: id, userId })),
        });
        // Notify new assignees
        const newAssignees = assigneeIds.filter((uid: string) => uid !== session.user.id);
        if (newAssignees.length > 0) {
          await tx.notification.createMany({
            data: newAssignees.map((userId: string) => ({
              userId,
              type: "TASK_ASSIGNED" as const,
              title: "Nueva tarea asignada",
              body: updated.title,
              link: `/projects/${updated.projectId}?task=${id}`,
            })),
          });
        }
      }
    }

    // Update labels if provided
    if (labelIds !== undefined) {
      await tx.taskLabel.deleteMany({ where: { taskId: id } });
      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId: string) => ({ taskId: id, labelId })),
        });
      }
    }

    return updated;
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Task",
      entityId: id,
      oldValues: { status: oldTask.status, priority: oldTask.priority },
      newValues: { status: task.status, priority: task.priority },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.task.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: session.user.id, action: "DELETE", entity: "Task", entityId: id },
  });

  return NextResponse.json({ success: true });
}

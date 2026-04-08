import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { addDays } from "date-fns";

const createTaskSchema = z.object({
  projectId: z.string(),
  columnId: z.string().optional(),
  sprintId: z.string().optional(),
  parentId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["BACKLOG","TODO","IN_PROGRESS","IN_REVIEW","BLOCKED","DONE","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  estimatedHours: z.number().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
  isPublicToClient: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const sprintId = searchParams.get("sprintId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const dueIn = searchParams.get("dueIn"); // días
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("search");

    const where: any = { parentId: null }; // solo tareas raíz por defecto

    if (projectId) where.projectId = projectId;
    if (sprintId) where.sprintId = sprintId;
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (priority) where.priority = priority;
    if (assigneeId) {
      where.assignments = { some: { userId: assigneeId } };
    }
    if (dueIn) {
      const daysAhead = parseInt(dueIn);
      where.dueDate = { lte: addDays(new Date(), daysAhead), gte: new Date() };
      where.status = { notIn: ["DONE", "CANCELLED"] };
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    // Empleados solo ven sus tareas asignadas
    if (session.user.role === "EMPLEADO") {
      where.assignments = { some: { userId: session.user.id } };
    }
    // Clientes solo ven tareas públicas
    if (session.user.role === "CLIENTE") {
      where.isPublicToClient = true;
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          assignments: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          labels: {
            include: { label: { select: { id: true, name: true, color: true } } },
          },
          project: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true, attachments: true, subtasks: true } },
        },
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { assigneeIds, labelIds, ...data } = parsed.data;

    // Block new tasks when the project has an active distribution pool
    if (data.projectId) {
      const pool = await db.projectPool.findUnique({ where: { projectId: data.projectId } });
      if (pool) {
        return NextResponse.json(
          { error: "No se pueden agregar tareas con distribución activa. Desactivá el pool primero." },
          { status: 403 }
        );
      }
    }

    // Obtener el máximo order en la columna/proyecto
    const lastTask = await db.task.findFirst({
      where: { projectId: data.projectId, columnId: data.columnId ?? null },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await db.task.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        order: (lastTask?.order ?? -1) + 1,
        createdById: session.user.id,
        assignments: assigneeIds?.length
          ? { createMany: { data: assigneeIds.map((userId) => ({ userId })) } }
          : undefined,
        labels: labelIds?.length
          ? { createMany: { data: labelIds.map((labelId) => ({ labelId })) } }
          : undefined,
      },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, image: true } } } },
        labels: { include: { label: true } },
        project: { select: { id: true, name: true, slug: true } },
      },
    });

    // Notificar a los asignados
    if (assigneeIds?.length) {
      await db.notification.createMany({
        data: assigneeIds
          .filter((id) => id !== session.user.id)
          .map((userId) => ({
            userId,
            type: "TASK_ASSIGNED" as const,
            title: "Nueva tarea asignada",
            body: `Se te asignó: ${data.title}`,
            link: `/projects/${task.projectId}?task=${task.id}`,
          })),
      });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Task",
        entityId: task.id,
        newValues: { title: data.title, projectId: data.projectId },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

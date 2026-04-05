import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Find client record for this user
  const client = await db.client.findFirst({
    where: { userId: session.user.id },
    select: { id: true, name: true, company: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const [activeProjects, pendingInvoices, openTasks, recentActivity] = await Promise.all([
    db.project.findMany({
      where: {
        clientId: client.id,
        status: { in: ["ACTIVE", "ON_HOLD"] },
      },
      select: {
        id: true, name: true, slug: true, status: true,
        endDate: true, description: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.invoice.findMany({
      where: {
        clientId: client.id,
        status: { in: ["SENT", "OVERDUE"] },
      },
      select: { id: true, number: true, total: true, status: true, dueDate: true, issueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.task.count({
      where: {
        project: { clientId: client.id },
        status: { notIn: ["DONE"] },
      },
    }),
    db.auditLog.findMany({
      where: {
        entity: { in: ["Project", "Task", "Invoice", "Document"] },
      },
      select: { action: true, entity: true, createdAt: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    client,
    activeProjects,
    pendingInvoices,
    openTasks,
    recentActivity,
  });
}

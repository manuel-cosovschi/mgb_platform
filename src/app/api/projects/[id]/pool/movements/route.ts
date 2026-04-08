import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await db.projectPool.findUnique({ where: { projectId: id } });
  if (!pool) return NextResponse.json([]);

  const movements = await db.distributionMovement.findMany({
    where: { poolId: pool.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Enrich with user names
  const userIds = [...new Set([...movements.map(m => m.fromUser), ...movements.map(m => m.toUser)].filter(Boolean))] as string[];
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const taskIds = [...new Set(movements.map(m => m.taskId))];
  const tasks = await db.task.findMany({ where: { id: { in: taskIds } }, select: { id: true, title: true } });
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t.title]));

  return NextResponse.json(movements.map(m => ({
    ...m,
    fromUserName: m.fromUser ? userMap[m.fromUser] : null,
    toUserName: m.toUser ? userMap[m.toUser] : null,
    taskTitle: taskMap[m.taskId] ?? "Tarea eliminada",
  })));
}

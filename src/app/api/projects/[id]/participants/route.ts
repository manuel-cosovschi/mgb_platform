import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participants = await db.projectParticipant.findMany({
    where: { projectId: id, status: { not: "LEFT" } },
    include: { user: { select: { id: true, name: true, image: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(participants);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, userId } = await req.json();

  if (action === "leave") {
    // Release all assigned tasks
    const pool = await db.projectPool.findUnique({ where: { projectId: id } });
    if (pool) {
      const myTasks = await db.taskDistribution.findMany({
        where: { poolId: pool.id, assignedTo: session.user.id, status: { in: ["ASSIGNED", "CLAIMED"] } },
      });
      if (myTasks.length) {
        await db.taskDistribution.updateMany({
          where: { poolId: pool.id, assignedTo: session.user.id, status: { in: ["ASSIGNED", "CLAIMED"] } },
          data: { status: "RELEASED", releasedAt: new Date(), assignedTo: null },
        });
      }
    }
    await db.projectParticipant.updateMany({
      where: { projectId: id, userId: session.user.id },
      data: { status: "LEFT", leftAt: new Date() },
    });
    return NextResponse.json({ left: true });
  }

  if (action === "invite" && userId) {
    await db.projectParticipant.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role: "MEMBER", status: "INVITED" },
      update: { status: "INVITED", leftAt: null },
    });
    return NextResponse.json({ invited: true });
  }

  if (action === "accept") {
    await db.projectParticipant.updateMany({
      where: { projectId: id, userId: session.user.id, status: "INVITED" },
      data: { status: "ACTIVE" },
    });
    return NextResponse.json({ accepted: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

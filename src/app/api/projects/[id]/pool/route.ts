import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, poolCreatedEmail } from "@/lib/email";

// GET — current pool distribution
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await db.projectPool.findUnique({
    where: { projectId: id },
    include: {
      distributions: {
        include: {
          task: { select: { id: true, title: true, status: true, storyPoints: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!pool) return NextResponse.json(null);

  // Group by assignedTo
  const byUser: Record<string, { userId: string | null; name: string; tasks: number; points: number; value: number; completed: number }> = {};

  for (const d of pool.distributions) {
    const key = d.assignedTo ?? "__unassigned__";
    if (!byUser[key]) {
      byUser[key] = {
        userId: d.assignedTo,
        name: d.user?.name ?? "Sin asignar",
        tasks: 0, points: 0, value: 0, completed: 0,
      };
    }
    byUser[key].tasks++;
    byUser[key].points += d.points;
    byUser[key].value += d.monetaryValue;
    if (d.status === "COMPLETED") byUser[key].completed++;
  }

  return NextResponse.json({ pool, summary: Object.values(byUser) });
}

// POST — create pool and distribute tasks
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { totalBudget, operatingCostPct = 0.2, participantIds } = body;

  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json({ error: "totalBudget requerido" }, { status: 400 });
  }

  // Check existing pool
  const existing = await db.projectPool.findUnique({ where: { projectId: id } });
  if (existing) return NextResponse.json({ error: "Pool ya existe" }, { status: 409 });

  const project = await db.project.findUnique({
    where: { id },
    include: { tasks: { select: { id: true, title: true, storyPoints: true } } },
  });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const distributablePool = totalBudget * (1 - operatingCostPct);
  const totalPoints = project.tasks.reduce((s, t) => s + t.storyPoints, 0);

  // Determine participants (use participantIds or all socios if not provided)
  let participants: { id: string; name: string; email: string }[] = [];
  if (participantIds?.length) {
    const users = await db.user.findMany({ where: { id: { in: participantIds }, role: "SOCIO" }, select: { id: true, name: true, email: true } });
    participants = users;
  } else {
    participants = await db.user.findMany({ where: { role: "SOCIO" }, select: { id: true, name: true, email: true } });
  }

  // Create pool in transaction
  const pool = await db.$transaction(async (tx) => {
    const pool = await tx.projectPool.create({
      data: { projectId: id, totalBudget, operatingCostPct, distributablePool, totalPoints },
    });

    // Upsert participants
    for (const p of participants) {
      await tx.projectParticipant.upsert({
        where: { projectId_userId: { projectId: id, userId: p.id } },
        create: { projectId: id, userId: p.id, role: p.id === session.user.id ? "CREATOR" : "MEMBER" },
        update: { status: "ACTIVE" },
      });
    }

    if (!project.tasks.length) return pool;

    // Distribute tasks round-robin by points
    const sorted = [...project.tasks].sort((a, b) => b.storyPoints - a.storyPoints);
    const loads = participants.map(p => ({ userId: p.id, points: 0 }));

    const distributions: { poolId: string; taskId: string; assignedTo: string; points: number; monetaryValue: number; percentage: number }[] = [];
    const movements: { poolId: string; taskId: string; action: "INITIAL_ASSIGN"; toUser: string; points: number; value: number }[] = [];

    for (const task of sorted) {
      const lightestIdx = loads.reduce((minI, l, i) => l.points < loads[minI].points ? i : minI, 0);
      const assignee = loads[lightestIdx];
      const value = totalPoints > 0 ? (distributablePool * task.storyPoints) / totalPoints : 0;
      const pct = totalPoints > 0 ? task.storyPoints / totalPoints : 0;

      distributions.push({ poolId: pool.id, taskId: task.id, assignedTo: assignee.userId, points: task.storyPoints, monetaryValue: value, percentage: pct });
      movements.push({ poolId: pool.id, taskId: task.id, action: "INITIAL_ASSIGN", toUser: assignee.userId, points: task.storyPoints, value });
      loads[lightestIdx].points += task.storyPoints;
    }

    await tx.taskDistribution.createMany({ data: distributions });
    await tx.distributionMovement.createMany({ data: movements });

    return pool;
  });

  // Send emails async (don't await — don't block response)
  const allSocios = await db.user.findMany({ where: { role: "SOCIO" }, select: { id: true, name: true, email: true } });
  const participantSet = new Set(participants.map(p => p.id));
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://mgb-hub.vercel.app";

  for (const socio of allSocios) {
    const myDists = pool ? await db.taskDistribution.findMany({ where: { poolId: pool.id, assignedTo: socio.id } }) : [];
    const myPoints = myDists.reduce((s, d) => s + d.points, 0);
    const myValue = myDists.reduce((s, d) => s + d.monetaryValue, 0);

    sendEmail(socio.email, `🚀 Nuevo proyecto: ${project.name}`, poolCreatedEmail({
      recipientName: socio.name.split(" ")[0],
      projectName: project.name,
      projectUrl: `${baseUrl}/projects/${project.slug}?tab=distribucion`,
      totalBudget,
      pool: distributablePool,
      currency: project.budgetCurrency,
      tasks: myDists.length,
      points: myPoints,
      value: myValue,
      participating: participantSet.has(socio.id),
      participants: participants.map(p => p.name),
    }));
  }

  return NextResponse.json(pool, { status: 201 });
}

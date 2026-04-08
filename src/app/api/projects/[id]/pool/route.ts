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

// Score a task against a socio's specialties
function scoreTask(taskTitle: string, specialties: string[]): number {
  const text = taskTitle.toLowerCase();
  return specialties.filter((s) => text.includes(s.toLowerCase())).length;
}

// POST — create pool and distribute tasks (supports dryRun preview)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    totalBudget,
    operatingCostPct = 0.2,
    participantIds,
    storyPointsMap = {} as Record<string, number>,
    dryRun = false,
  } = body;

  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json({ error: "totalBudget requerido" }, { status: 400 });
  }

  // Block duplicate pools (except for dryRun)
  if (!dryRun) {
    const existing = await db.projectPool.findUnique({ where: { projectId: id } });
    if (existing) return NextResponse.json({ error: "Pool ya existe" }, { status: 409 });
  }

  const project = await db.project.findUnique({
    where: { id },
    include: { tasks: { select: { id: true, title: true, storyPoints: true } } },
  });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  // Apply storyPointsMap overrides
  const tasksWithPoints = project.tasks.map((t) => ({
    ...t,
    storyPoints: (storyPointsMap[t.id] as number | undefined) ?? t.storyPoints,
  }));

  const distributablePool = totalBudget * (1 - operatingCostPct);
  const totalPoints = tasksWithPoints.reduce((s, t) => s + t.storyPoints, 0);

  // Load participants with their specialties
  const participantWhere =
    participantIds?.length
      ? { id: { in: participantIds as string[] }, role: "SOCIO" as const }
      : { role: "SOCIO" as const };

  const users = await db.user.findMany({
    where: participantWhere,
    select: {
      id: true,
      name: true,
      email: true,
      partnerProfile: { select: { specialties: true } },
    },
  });

  const participants = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    specialties: u.partnerProfile?.specialties ?? [],
  }));

  if (!participants.length) {
    return NextResponse.json({ error: "No hay participantes" }, { status: 400 });
  }

  // Specialty-aware distribution: score each task per socio, assign best match (tie-break by load)
  const sorted = [...tasksWithPoints].sort((a, b) => b.storyPoints - a.storyPoints);
  const loads = participants.map((p) => ({ userId: p.id, points: 0 }));

  type Assignment = {
    taskId: string;
    taskTitle: string;
    assignedTo: string;
    assignedName: string;
    points: number;
    monetaryValue: number;
    percentage: number;
  };
  const assignments: Assignment[] = [];

  for (const task of sorted) {
    const scores = participants.map((p, i) => ({
      idx: i,
      score: scoreTask(task.title, p.specialties),
      load: loads[i].points,
    }));
    // Highest specialty score first, then lowest load as tie-breaker
    scores.sort((a, b) => b.score - a.score || a.load - b.load);
    const best = scores[0];
    const assignee = participants[best.idx];
    const value = totalPoints > 0 ? (distributablePool * task.storyPoints) / totalPoints : 0;
    const pct = totalPoints > 0 ? task.storyPoints / totalPoints : 0;

    assignments.push({
      taskId: task.id,
      taskTitle: task.title,
      assignedTo: assignee.id,
      assignedName: assignee.name,
      points: task.storyPoints,
      monetaryValue: value,
      percentage: pct,
    });
    loads[best.idx].points += task.storyPoints;
  }

  // DryRun — return preview without saving
  if (dryRun) {
    const summary = participants.map((p) => {
      const mine = assignments.filter((a) => a.assignedTo === p.id);
      return {
        userId: p.id,
        name: p.name,
        tasks: mine.length,
        points: mine.reduce((s, a) => s + a.points, 0),
        value: mine.reduce((s, a) => s + a.monetaryValue, 0),
      };
    });
    return NextResponse.json({
      dryRun: true,
      assignments,
      summary,
      totalBudget,
      distributablePool,
      totalPoints,
    });
  }

  // Create pool in transaction
  const pool = await db.$transaction(async (tx) => {
    // Persist story point overrides
    for (const [taskId, pts] of Object.entries(storyPointsMap)) {
      await tx.task.update({ where: { id: taskId }, data: { storyPoints: pts as number } });
    }

    const created = await tx.projectPool.create({
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

    if (!assignments.length) return created;

    await tx.taskDistribution.createMany({
      data: assignments.map((a) => ({
        poolId: created.id,
        taskId: a.taskId,
        assignedTo: a.assignedTo,
        points: a.points,
        monetaryValue: a.monetaryValue,
        percentage: a.percentage,
      })),
    });
    await tx.distributionMovement.createMany({
      data: assignments.map((a) => ({
        poolId: created.id,
        taskId: a.taskId,
        action: "INITIAL_ASSIGN" as const,
        toUser: a.assignedTo,
        points: a.points,
        value: a.monetaryValue,
      })),
    });

    return created;
  });

  // Emails (fire-and-forget)
  const allSocios = await db.user.findMany({ where: { role: "SOCIO" }, select: { id: true, name: true, email: true } });
  const participantSet = new Set(participants.map((p) => p.id));
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://mgb-hub.vercel.app";

  for (const socio of allSocios) {
    const mine = assignments.filter((a) => a.assignedTo === socio.id);
    sendEmail(socio.email, `🚀 Nuevo proyecto: ${project.name}`, poolCreatedEmail({
      recipientName: socio.name.split(" ")[0],
      projectName: project.name,
      projectUrl: `${baseUrl}/projects/${project.slug}?tab=distribucion`,
      totalBudget,
      pool: distributablePool,
      currency: project.budgetCurrency,
      tasks: mine.length,
      points: mine.reduce((s, a) => s + a.points, 0),
      value: mine.reduce((s, a) => s + a.monetaryValue, 0),
      participating: participantSet.has(socio.id),
      participants: participants.map((p) => p.name),
    }));
  }

  return NextResponse.json(pool, { status: 201 });
}

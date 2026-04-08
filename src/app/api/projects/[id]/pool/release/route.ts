import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, tasksReleasedEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { taskIds } = await req.json() as { taskIds: string[] };
  if (!taskIds?.length) return NextResponse.json({ error: "taskIds requerido" }, { status: 400 });

  const pool = await db.projectPool.findUnique({
    where: { projectId: id },
    include: {
      distributions: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!pool) return NextResponse.json({ error: "Pool no encontrado" }, { status: 404 });

  // Check minimum load rule (20%)
  const myDists = pool.distributions.filter(d => d.assignedTo === session.user.id && d.status !== "RELEASED");
  const releasePoints = pool.distributions.filter(d => taskIds.includes(d.taskId) && d.assignedTo === session.user.id).reduce((s, d) => s + d.points, 0);
  const remainingPoints = myDists.reduce((s, d) => s + d.points, 0) - releasePoints;
  const totalAssigned = pool.distributions.filter(d => d.assignedTo !== null && d.status !== "RELEASED").reduce((s, d) => s + d.points, 0);
  const minPoints = totalAssigned * 0.2;

  if (remainingPoints < minPoints && totalAssigned > 0) {
    return NextResponse.json({ error: `No podés quedar con menos del 20% del pool (mínimo ${minPoints.toFixed(0)} puntos)` }, { status: 400 });
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.taskDistribution.updateMany({
      where: { poolId: pool.id, taskId: { in: taskIds }, assignedTo: session.user.id },
      data: { status: "RELEASED", releasedAt: now, assignedTo: null },
    });
    const movs = taskIds.map(taskId => {
      const d = pool.distributions.find(x => x.taskId === taskId);
      return { poolId: pool.id, taskId, action: "RELEASED" as const, fromUser: session.user.id, points: d?.points ?? 0, value: d?.monetaryValue ?? 0 };
    });
    await tx.distributionMovement.createMany({ data: movs });
  });

  // Send email to other socios
  const releasedDists = pool.distributions.filter(d => taskIds.includes(d.taskId));
  const totalPoints = releasedDists.reduce((s, d) => s + d.points, 0);
  const totalValue = releasedDists.reduce((s, d) => s + d.monetaryValue, 0);

  const project = await db.project.findUnique({ where: { id }, select: { name: true, slug: true, budgetCurrency: true } });
  const otherSocios = await db.user.findMany({ where: { role: "SOCIO", id: { not: session.user.id } }, select: { name: true, email: true } });
  const releaserName = session.user.name ?? "Un socio";
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://mgb-hub.vercel.app";

  // Build distribution summary
  const distSummary = pool.distributions.reduce((acc: Record<string, { name: string; points: number; value: number }>, d) => {
    if (!d.assignedTo || taskIds.includes(d.taskId)) return acc;
    const key = d.assignedTo;
    if (!acc[key]) acc[key] = { name: d.user?.name ?? "?", points: 0, value: 0 };
    acc[key].points += d.points;
    acc[key].value += d.monetaryValue;
    return acc;
  }, {});
  const allPoints = Object.values(distSummary).reduce((s, x) => s + x.points, 0) + totalPoints;
  const distribution = [
    ...Object.values(distSummary).map(x => ({ ...x, pct: allPoints > 0 ? (x.points / allPoints) * 100 : 0 })),
    { name: "Sin asignar", points: totalPoints, value: totalValue, pct: allPoints > 0 ? (totalPoints / allPoints) * 100 : 0 },
  ];

  for (const socio of otherSocios) {
    sendEmail(socio.email, `🔄 ${releaserName} liberó tareas del proyecto ${project?.name}`, tasksReleasedEmail({
      recipientName: socio.name.split(" ")[0],
      releaserName,
      projectName: project?.name ?? "",
      projectUrl: `${baseUrl}/projects/${project?.slug}?tab=distribucion`,
      tasks: releasedDists.map(d => ({ title: "", points: d.points, value: d.monetaryValue })),
      totalPoints,
      totalValue,
      currency: project?.budgetCurrency ?? "USD",
      distribution,
    }));
  }

  return NextResponse.json({ released: taskIds.length, totalPoints, totalValue });
}

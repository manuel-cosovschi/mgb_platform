import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, taskClaimedEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = await db.projectPool.findUnique({ where: { projectId: id } });
  if (!pool) return NextResponse.json({ error: "Pool no encontrado" }, { status: 404 });

  // Optimistic lock: find and update in one transaction
  const dist = await db.taskDistribution.findFirst({
    where: { poolId: pool.id, taskId, status: "RELEASED" },
  });
  if (!dist) return NextResponse.json({ error: "Tarea no disponible" }, { status: 409 });

  // Atomic update — only succeeds if still RELEASED
  const updated = await db.$transaction(async (tx) => {
    const current = await tx.taskDistribution.findUnique({ where: { id: dist.id } });
    if (current?.status !== "RELEASED") throw new Error("CLAIMED_ALREADY");

    await tx.taskDistribution.update({
      where: { id: dist.id },
      data: { assignedTo: session.user.id, status: "CLAIMED", claimedAt: new Date() },
    });
    await tx.distributionMovement.create({
      data: { poolId: pool.id, taskId, action: "CLAIMED", toUser: session.user.id, points: dist.points, value: dist.monetaryValue },
    });
    return { points: dist.points, value: dist.monetaryValue };
  }).catch(e => {
    if (e.message === "CLAIMED_ALREADY") return null;
    throw e;
  });

  if (!updated) return NextResponse.json({ error: "Otra persona reclamó la tarea primero" }, { status: 409 });

  // Notify all socios
  const project = await db.project.findUnique({ where: { id }, select: { name: true, slug: true, budgetCurrency: true } });
  const task = await db.task.findUnique({ where: { id: taskId }, select: { title: true } });
  const allSocios = await db.user.findMany({ where: { role: "SOCIO" }, select: { name: true, email: true } });
  const claimerName = session.user.name ?? "Un socio";
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://mgb-hub.vercel.app";

  for (const socio of allSocios) {
    sendEmail(socio.email, `✅ ${claimerName} reclamó una tarea en ${project?.name}`, taskClaimedEmail({
      recipientName: socio.name.split(" ")[0],
      claimerName,
      taskTitle: task?.title ?? "Tarea",
      taskValue: updated.value,
      currency: project?.budgetCurrency ?? "USD",
      projectName: project?.name ?? "",
      projectUrl: `${baseUrl}/projects/${project?.slug}?tab=distribucion`,
    }));
  }

  return NextResponse.json({ claimed: true, points: updated.points, value: updated.value });
}

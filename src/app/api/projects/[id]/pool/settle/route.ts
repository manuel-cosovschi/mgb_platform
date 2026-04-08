import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, settlementEmail } from "@/lib/email";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pool = await db.projectPool.findUnique({ where: { projectId: id }, include: { settlement: true } });
  if (!pool) return NextResponse.json(null);
  return NextResponse.json(pool.settlement);
}

// POST — initiate settlement (mark pool as done, compute payouts)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const isApprove = body.approve === true;

  const pool = await db.projectPool.findUnique({
    where: { projectId: id },
    include: { distributions: true, settlement: true },
  });
  if (!pool) return NextResponse.json({ error: "Pool no encontrado" }, { status: 404 });

  if (isApprove && pool.settlement) {
    // Add approval
    const existing = pool.settlement.approvedBy;
    if (existing.includes(session.user.id)) return NextResponse.json({ error: "Ya aprobaste" }, { status: 400 });
    const newApprovedBy = [...existing, session.user.id];
    const totalSocios = await db.user.count({ where: { role: "SOCIO" } });

    const updated = await db.projectSettlement.update({
      where: { id: pool.settlement.id },
      data: { approvedBy: newApprovedBy, status: newApprovedBy.length >= totalSocios ? "APPROVED" : "PENDING" },
    });
    return NextResponse.json(updated);
  }

  // Compute settlement details from completed tasks
  const completed = pool.distributions.filter((d: any) => d.status === "COMPLETED");
  const userIds = [...new Set(completed.map((d: any) => d.assignedTo).filter(Boolean))] as string[];
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });

  const details = users.map((u: any) => {
    const userTasks = completed.filter((d: any) => d.assignedTo === u.id);
    return { userId: u.id, name: u.name, tasks: userTasks.length, points: userTasks.reduce((s: number, d: any) => s + d.points, 0), value: userTasks.reduce((s: number, d: any) => s + d.monetaryValue, 0) };
  });

  const settlement = await db.$transaction(async (tx) => {
    await tx.projectPool.update({ where: { id: pool.id }, data: { status: "SETTLED", settledAt: new Date() } });
    return tx.projectSettlement.create({
      data: { poolId: pool.id, details, approvedBy: [session.user.id] },
    });
  });

  // Email all socios
  const project = await db.project.findUnique({ where: { id }, select: { name: true, slug: true, budgetCurrency: true } });
  const allSocios = await db.user.findMany({ where: { role: "SOCIO" }, select: { name: true, email: true } });
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://mgb-hub.vercel.app";
  for (const socio of allSocios) {
    sendEmail(socio.email, `📋 Liquidación pendiente: ${project?.name}`, settlementEmail({
      recipientName: socio.name.split(" ")[0],
      projectName: project?.name ?? "",
      projectUrl: `${baseUrl}/projects/${project?.slug}?tab=distribucion`,
      currency: project?.budgetCurrency ?? "USD",
      details,
    }));
  }

  return NextResponse.json(settlement, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/** Execute the action of an approval record and mark it EXECUTED */
async function executeApproval(approvalId: string, projectId: string, action: string) {
  if (action === "DELETE") {
    await db.project.delete({ where: { id: projectId } });
  } else if (action === "PAUSE") {
    await db.project.update({ where: { id: projectId }, data: { status: "ON_HOLD" } });
  }
  await db.projectApproval.update({
    where: { id: approvalId },
    data: { status: "EXECUTED" },
  });
}

// GET — pending approval for this project (also triggers lazy expiry)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Lazy expiry: execute any timer that has run out
  // Primary: explicit expiresAt set on record
  let expired = await db.projectApproval.findFirst({
    where: { projectId: id, status: "PENDING", expiresAt: { lte: new Date() } },
  });
  // Fallback: legacy approvals created before expiresAt field existed — treat any
  // PENDING approval with no expiresAt that is older than 12h as expired.
  // status: "PENDING" already guarantees nobody rejected (rejection sets → CANCELLED).
  if (!expired) {
    const TWELVE_HOURS_AGO = new Date(Date.now() - 12 * 60 * 60 * 1000);
    expired = await db.projectApproval.findFirst({
      where: { projectId: id, status: "PENDING", expiresAt: null, createdAt: { lte: TWELVE_HOURS_AGO } },
    });
  }
  if (expired) {
    try {
      await executeApproval(expired.id, id, expired.action);
    } catch {
      // Project may already be gone
    }
    return NextResponse.json({ expired: true, executed: true, action: expired.action });
  }

  const approval = await db.projectApproval.findFirst({
    where: { projectId: id, status: "PENDING" },
    include: { requester: { select: { id: true, name: true } } },
  });

  return NextResponse.json(approval);
}

// POST — request action or vote
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json(); // "DELETE" | "PAUSE" | "APPROVE" | "REJECT" | "CANCEL"
  const userId = session.user.id;

  // ── CANCEL (requester retracts) ────────────────────────────────────────────
  if (action === "CANCEL") {
    await db.projectApproval.updateMany({
      where: { projectId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true });
  }

  // ── REJECT (any socio blocks immediately) ──────────────────────────────────
  if (action === "REJECT") {
    const approval = await db.projectApproval.findFirst({
      where: { projectId: id, status: "PENDING" },
    });
    if (!approval) return NextResponse.json({ error: "No pending approval" }, { status: 404 });

    await db.projectApproval.update({
      where: { id: approval.id },
      data: {
        status: "CANCELLED",
        rejectedBy: [...(approval.rejectedBy ?? []), userId],
      },
    });
    return NextResponse.json({ cancelled: true });
  }

  const totalSocios = await db.user.count({ where: { role: "SOCIO" } });

  // ── APPROVE ────────────────────────────────────────────────────────────────
  if (action === "APPROVE") {
    const approval = await db.projectApproval.findFirst({
      where: { projectId: id, status: "PENDING" },
    });
    if (!approval) return NextResponse.json({ error: "No pending approval" }, { status: 404 });
    if (approval.approvedBy.includes(userId)) {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }

    const newApprovedBy = [...approval.approvedBy, userId];
    const allApproved = newApprovedBy.length >= totalSocios;

    if (allApproved) {
      await executeApproval(approval.id, id, approval.action);
      return NextResponse.json({ executed: true, action: approval.action });
    }

    await db.projectApproval.update({
      where: { id: approval.id },
      data: { approvedBy: newApprovedBy },
    });
    return NextResponse.json({ executed: false, approvals: newApprovedBy.length, total: totalSocios });
  }

  // ── CREATE new request (DELETE or PAUSE) ───────────────────────────────────
  // Cancel any existing pending approval first
  await db.projectApproval.updateMany({
    where: { projectId: id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  // Every SOCIO request gets a 12h veto window — if nobody rejects within 12h, it executes.
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

  const approval = await db.projectApproval.create({
    data: {
      projectId: id,
      action,
      requestedBy: userId,
      approvedBy: [userId], // requester auto-approves
      expiresAt,
    },
    include: { requester: { select: { id: true, name: true } } },
  });

  // If only 1 socio exists → execute immediately
  if (approval.approvedBy.length >= totalSocios) {
    await executeApproval(approval.id, id, action);
    return NextResponse.json({ executed: true, action });
  }

  return NextResponse.json({
    executed: false,
    approval,
    approvals: 1,
    total: totalSocios,
    isCeoRequest: true,
    expiresAt,
  });
}

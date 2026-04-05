import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

// GET — get pending approval for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const approval = await db.projectApproval.findFirst({
    where: { projectId: id, status: "PENDING" },
    include: { requester: { select: { id: true, name: true } } },
  });

  return NextResponse.json(approval);
}

// POST — request action or add approval
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json(); // "DELETE" | "PAUSE" | "APPROVE" | "CANCEL"
  const userId = session.user.id;

  if (action === "CANCEL") {
    await db.projectApproval.updateMany({
      where: { projectId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true });
  }

  // Count total socios
  const totalSocios = await db.user.count({ where: { role: "SOCIO" } });

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
      // Execute the action
      if (approval.action === "DELETE") {
        await db.project.delete({ where: { id } });
      } else if (approval.action === "PAUSE") {
        await db.project.update({ where: { id }, data: { status: "ON_HOLD" } });
      }
      await db.projectApproval.update({
        where: { id: approval.id },
        data: { approvedBy: newApprovedBy, status: "EXECUTED" },
      });
      return NextResponse.json({ executed: true, action: approval.action });
    } else {
      await db.projectApproval.update({
        where: { id: approval.id },
        data: { approvedBy: newApprovedBy },
      });
      return NextResponse.json({ executed: false, approvals: newApprovedBy.length, total: totalSocios });
    }
  }

  // Create new approval request (DELETE or PAUSE)
  // Cancel any existing pending approval first
  await db.projectApproval.updateMany({
    where: { projectId: id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  const approval = await db.projectApproval.create({
    data: {
      projectId: id,
      action,
      requestedBy: userId,
      approvedBy: [userId], // requester auto-approves
    },
    include: { requester: { select: { id: true, name: true } } },
  });

  const allApproved = approval.approvedBy.length >= totalSocios;
  if (allApproved) {
    if (action === "DELETE") await db.project.delete({ where: { id } });
    else if (action === "PAUSE") await db.project.update({ where: { id }, data: { status: "ON_HOLD" } });
    await db.projectApproval.update({ where: { id: approval.id }, data: { status: "EXECUTED" } });
    return NextResponse.json({ executed: true, action });
  }

  return NextResponse.json({ executed: false, approval, approvals: 1, total: totalSocios });
}

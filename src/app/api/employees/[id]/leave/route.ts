import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { differenceInBusinessDays } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.leaveRequest.findMany({
    where: { employeeId: id },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const days = Math.max(1, differenceInBusinessDays(end, start) + 1);

  const request = await db.leaveRequest.create({
    data: {
      employeeId: id,
      type: body.type,
      startDate: start,
      endDate: end,
      days,
      reason: body.reason,
    },
  });
  return NextResponse.json(request, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { requestId, status } = await req.json();
  const updated = await db.leaveRequest.update({
    where: { id: requestId },
    data: { status, approvedBy: session.user.id, approvedAt: new Date() },
  });
  return NextResponse.json(updated);
}

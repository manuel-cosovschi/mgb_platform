import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Update key result progress
  if (body.keyResultId !== undefined) {
    const kr = await db.keyResult.update({
      where: { id: body.keyResultId },
      data: {
        currentValue: body.currentValue,
        progress: Math.min(100, (body.currentValue / body.targetValue) * 100),
      },
    });

    // Recompute OKR progress as average of KR progresses
    const allKRs = await db.keyResult.findMany({ where: { okrId: id } });
    const avgProgress = allKRs.reduce((s, k) => s + Number(k.progress), 0) / (allKRs.length || 1);
    await db.oKR.update({ where: { id }, data: { progress: avgProgress } });

    return NextResponse.json(kr);
  }

  const okr = await db.oKR.update({ where: { id }, data: body });
  return NextResponse.json(okr);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "checkin") {
    const checkIn = await db.oKRCheckIn.create({
      data: {
        okrId: id,
        authorId: session.user.id,
        progress: body.progress,
        notes: body.notes,
        blockers: body.blockers,
      },
    });
    await db.oKR.update({ where: { id }, data: { progress: body.progress } });
    return NextResponse.json(checkIn, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

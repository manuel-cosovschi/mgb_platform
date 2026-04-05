import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const ownerId = searchParams.get("ownerId");

  const where: any = {};
  if (period) where.period = period;
  if (ownerId) where.ownerId = ownerId;
  if (session.user.role === "EMPLEADO") where.ownerId = session.user.id;

  const okrs = await db.oKR.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      keyResults: { orderBy: { createdAt: "asc" } },
      checkIns: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: { select: { checkIns: true } },
    },
  });

  return NextResponse.json(okrs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const okr = await db.oKR.create({
    data: {
      title: body.title,
      description: body.description,
      ownerId: body.ownerId ?? session.user.id,
      parentId: body.parentId,
      status: "ACTIVE",
      frequency: body.frequency ?? "QUARTERLY",
      period: body.period,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      keyResults: body.keyResults?.length ? {
        createMany: {
          data: body.keyResults.map((kr: any) => ({
            title: kr.title,
            targetValue: kr.targetValue,
            currentValue: 0,
            unit: kr.unit,
            progress: 0,
          })),
        },
      } : undefined,
    },
    include: {
      keyResults: true,
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(okr, { status: 201 });
}

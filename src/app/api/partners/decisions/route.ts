import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const decisions = await db.decisionLog.findMany({
    orderBy: { decisionDate: "desc" },
    include: { maker: { include: { user: { select: { name: true } } } } },
  });
  return NextResponse.json(decisions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const partner = await db.partner.findFirst({ where: { userId: session.user.id } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const decision = await db.decisionLog.create({
    data: {
      title: body.title,
      description: body.description,
      outcome: body.outcome,
      decisionDate: new Date(body.decisionDate ?? Date.now()),
      makerId: partner.id,
    },
  });
  return NextResponse.json(decision, { status: 201 });
}

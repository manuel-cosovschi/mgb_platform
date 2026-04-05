import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const partners = await db.partner.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      capitalContributions: { orderBy: { date: "desc" } },
      profitDistributions: { orderBy: { date: "desc" } },
      _count: { select: { decisionsMade: true } },
    },
  });

  return NextResponse.json(partners);
}

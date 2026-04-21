import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.sideProjectVote.findUnique({
    where: { sideProjectId_userId: { sideProjectId: id, userId: session.user.id } },
  });

  if (existing) {
    await db.sideProjectVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await db.sideProjectVote.create({
    data: { sideProjectId: id, userId: session.user.id, value: 1 },
  });

  return NextResponse.json({ voted: true });
}

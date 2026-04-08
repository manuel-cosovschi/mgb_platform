import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = await db.projectPool.findUnique({ where: { projectId: id } });
  if (!pool) return NextResponse.json([]);

  const available = await db.taskDistribution.findMany({
    where: { poolId: pool.id, status: "RELEASED" },
    include: { task: { select: { id: true, title: true, description: true, priority: true, storyPoints: true } } },
    orderBy: { releasedAt: "asc" },
  });

  return NextResponse.json(available);
}

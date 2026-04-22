import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = { isDeleted: false };

    const [
      total,
      byStatus,
      byType,
      byPriority,
      avgScore,
      topVoted,
      recentActivity,
    ] = await Promise.all([
      db.sideProject.count({ where }),
      db.sideProject.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      db.sideProject.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
      db.sideProject.groupBy({
        by: ["priority"],
        where,
        _count: true,
      }),
      db.sideProject.aggregate({
        where,
        _avg: { totalScore: true },
      }),
      db.sideProject.findMany({
        where,
        orderBy: { votes: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          title: true,
          emoji: true,
          totalScore: true,
          _count: { select: { votes: true } },
        },
      }),
      db.sideProjectActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          sideProject: { select: { id: true, title: true, emoji: true } },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      byStatus,
      byType,
      byPriority,
      avgScore: Math.round(avgScore._avg.totalScore ?? 0),
      topVoted,
      recentActivity,
    });
  } catch (error) {
    console.error("[SP_STATS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

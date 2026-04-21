import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [total, byStatus, topByScore, recent, activeProject] = await Promise.all([
      db.sideProject.count({ where: { active: true } }),
      db.sideProject.groupBy({
        by: ["status"],
        where: { active: true },
        _count: true,
      }),
      db.sideProject.findMany({
        where: { active: true },
        orderBy: { score: "desc" },
        take: 5,
        include: {
          owner: { select: { id: true, name: true, image: true } },
          votes: { select: { userId: true } },
        },
      }),
      db.sideProject.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { owner: { select: { id: true, name: true, image: true } } },
      }),
      db.sideProject.findFirst({
        where: { status: "IN_DEVELOPMENT", active: true },
        orderBy: { priorityOrder: "asc" },
        include: { owner: { select: { id: true, name: true, image: true } } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.status] = row._count;

    const totalRevenue = await db.sideProject.aggregate({
      where: { active: true, status: "LAUNCHED" },
      _sum: { totalRevenue: true },
    });

    return NextResponse.json({
      total,
      idea: statusMap["IDEA"] ?? 0,
      evaluating: statusMap["EVALUATING"] ?? 0,
      validating: statusMap["VALIDATING"] ?? 0,
      prioritized: statusMap["PRIORITIZED"] ?? 0,
      inDevelopment: statusMap["IN_DEVELOPMENT"] ?? 0,
      launched: statusMap["LAUNCHED"] ?? 0,
      archived: statusMap["ARCHIVED"] ?? 0,
      roiGenerated: totalRevenue._sum.totalRevenue ?? 0,
      activeProject,
      topByScore,
      recent,
    });
  } catch (error) {
    console.error("[SIDE_PROJECTS_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

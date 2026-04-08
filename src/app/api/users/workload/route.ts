import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const socios = await db.user.findMany({
    where: { role: "SOCIO" },
    select: { id: true, name: true, image: true },
  });

  const workloads = await Promise.all(socios.map(async (socio) => {
    const dists = await db.taskDistribution.findMany({
      where: { assignedTo: socio.id, status: { in: ["ASSIGNED", "CLAIMED"] } },
    });
    const totalPoints = dists.reduce((s: number, d: any) => s + d.points, 0);
    const totalValue = dists.reduce((s: number, d: any) => s + d.monetaryValue, 0);
    const activeProjects = await db.projectParticipant.count({
      where: { userId: socio.id, status: "ACTIVE", project: { status: "ACTIVE" } },
    });

    const loadLevel = totalPoints <= 30 ? "low" : totalPoints <= 60 ? "medium" : "high";

    return { userId: socio.id, name: socio.name, image: socio.image, activeProjects, totalAssignedPoints: totalPoints, totalAssignedValue: totalValue, loadLevel };
  }));

  return NextResponse.json(workloads);
}

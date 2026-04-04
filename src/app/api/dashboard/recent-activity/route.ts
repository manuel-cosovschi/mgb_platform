import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await db.auditLog.findMany({
      where: { action: { not: "LOGIN" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const activities = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      user: log.user,
      createdAt: log.createdAt,
    }));

    return NextResponse.json(activities);
  } catch (error) {
    console.error("[RECENT_ACTIVITY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

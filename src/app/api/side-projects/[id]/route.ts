import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { calculateScore } from "@/lib/side-projects/score-engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.sideProject.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        tasks: { orderBy: { order: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
        links: { orderBy: { createdAt: "desc" } },
        votes: { select: { userId: true, user: { select: { name: true, image: true } } } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: { select: { tasks: true, notes: true, links: true, votes: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[SIDE_PROJECT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Recalculate total score if any score dimension changed
    const scoreFields = ["revenueScore", "easeScore", "synergyScore", "speedScore", "riskScore"];
    const hasScoreChange = scoreFields.some((f) => f in body);

    let totalScore: number | undefined;
    if (hasScoreChange) {
      const existing = await db.sideProject.findUnique({
        where: { id },
        select: { revenueScore: true, easeScore: true, synergyScore: true, speedScore: true, riskScore: true },
      });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const merged = { ...existing, ...body };
      const result = calculateScore(merged);
      totalScore = result.total;
    }

    // Track status change
    const oldProject = await db.sideProject.findUnique({ where: { id }, select: { status: true } });
    const statusChanged = body.status && oldProject && body.status !== oldProject.status;

    const project = await db.sideProject.update({
      where: { id },
      data: {
        ...body,
        ...(totalScore !== undefined ? { totalScore } : {}),
        ...(body.launchDate ? { launchDate: new Date(body.launchDate) } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        votes: { select: { userId: true } },
        _count: { select: { tasks: true, notes: true, links: true, votes: true } },
      },
    });

    // Log activity
    if (statusChanged) {
      await db.sideProjectActivity.create({
        data: {
          sideProjectId: id,
          userId: session.user.id,
          action: "status_changed",
          details: { from: oldProject!.status, to: body.status },
        },
      });
    } else {
      await db.sideProjectActivity.create({
        data: {
          sideProjectId: id,
          userId: session.user.id,
          action: "updated",
          details: { fields: Object.keys(body) },
        },
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[SIDE_PROJECT_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.sideProject.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SIDE_PROJECT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

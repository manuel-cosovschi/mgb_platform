import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { calculateScore } from "@/lib/side-projects/score-engine";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  audience: z.string().optional(),
  type: z.enum(["SAAS", "MARKETPLACE", "TOOL", "AI", "ECOMMERCE", "APP", "OTHER"]).optional(),
  monetization: z.string().optional(),
  status: z.enum(["IDEA", "EVALUATING", "VALIDATING", "PRIORITIZED", "IN_DEVELOPMENT", "LAUNCHED", "ARCHIVED"]).optional(),
  complexity: z.number().min(1).max(10).optional(),
  revenuePotential: z.number().min(1).max(10).optional(),
  timeEstimate: z.string().optional(),
  investment: z.string().optional(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  synergy: z.number().min(1).max(10).optional(),
  stackSuggested: z.string().optional(),
  observations: z.string().optional(),
  brandName: z.string().optional(),
  slogan: z.string().optional(),
  brandColors: z.string().optional(),
  logoUrl: z.string().optional(),
  mrr: z.number().optional(),
  cac: z.number().optional(),
  roi: z.number().optional(),
  totalRevenue: z.number().optional(),
  totalCosts: z.number().optional(),
  launchedAt: z.string().optional(),
  active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await db.sideProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        links: true,
        tasks: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true, image: true } } },
        },
        votes: { select: { userId: true, value: true } },
        activityLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { tasks: true, notes: true, votes: true } },
      },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[SIDE_PROJECT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await db.sideProject.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = parsed.data;

    // Recalculate score if scoring fields changed
    const complexity = data.complexity ?? existing.complexity;
    const revenuePotential = data.revenuePotential ?? existing.revenuePotential;
    const synergy = data.synergy ?? existing.synergy;
    const risk = (data.risk ?? existing.risk) as "LOW" | "MEDIUM" | "HIGH";
    const timeEstimate = data.timeEstimate ?? existing.timeEstimate;
    const { score } = calculateScore({ complexity, revenuePotential, synergy, timeEstimate, risk });

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = slugify(data.title);
      const dup = await db.sideProject.findUnique({ where: { slug } });
      if (dup && dup.id !== id) slug = `${slug}-${Date.now()}`;
    }

    const updated = await db.sideProject.update({
      where: { id },
      data: {
        ...data,
        slug,
        score,
        launchedAt: data.launchedAt ? new Date(data.launchedAt) : existing.launchedAt,
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        links: true,
        tasks: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
        votes: { select: { userId: true, value: true } },
        _count: { select: { tasks: true, notes: true } },
      },
    });

    await db.sideProjectActivityLog.create({
      data: {
        sideProjectId: id,
        userId: session.user.id,
        action: "UPDATED",
        metadata: { fields: Object.keys(data) },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SIDE_PROJECT_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SOCIO") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.sideProject.update({ where: { id }, data: { active: false } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SIDE_PROJECT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

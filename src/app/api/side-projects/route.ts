import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { calculateScore } from "@/lib/side-projects/score-engine";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  targetAudience: z.string().optional(),
  status: z.enum(["IDEA", "EVALUATING", "APPROVED", "IN_DEVELOPMENT", "MVP_READY", "LAUNCHED", "PAUSED", "DISCARDED"]).optional(),
  type: z.enum(["SAAS", "MARKETPLACE", "AGENCY_SERVICE", "TEMPLATE", "TOOL", "CONTENT", "PHYSICAL", "OTHER"]).optional(),
  priority: z.enum(["P1_NOW", "P2_NEXT", "P3_LATER", "P4_MAYBE", "P5_SOMEDAY"]).optional(),
  complexity: z.enum(["TRIVIAL", "SIMPLE", "MODERATE", "COMPLEX", "MASSIVE"]).optional(),
  revenueScore: z.number().min(1).max(10).optional(),
  easeScore: z.number().min(1).max(10).optional(),
  synergyScore: z.number().min(1).max(10).optional(),
  speedScore: z.number().min(1).max(10).optional(),
  riskScore: z.number().min(1).max(10).optional(),
  estimatedHours: z.number().optional(),
  estimatedCost: z.number().optional(),
  monthlyRevenue: z.number().optional(),
  currency: z.enum(["ARS", "USD", "EUR"]).optional(),
  launchDate: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
  tags: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const page = parseInt(searchParams.get("page") ?? "1");
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const sortDir = searchParams.get("sortDir") ?? "desc";

    const where: Record<string, unknown> = { isDeleted: false };
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "score") {
      orderBy.totalScore = sortDir;
    } else if (sortBy === "priority") {
      orderBy.priority = sortDir === "desc" ? "asc" : "desc"; // P1 first
    } else {
      orderBy[sortBy] = sortDir;
    }

    const [projects, total] = await Promise.all([
      db.sideProject.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          votes: { select: { userId: true } },
          _count: { select: { tasks: true, notes: true, links: true, votes: true } },
        },
      }),
      db.sideProject.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[SIDE_PROJECTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, tags, techStack, competitors, launchDate, ...data } = parsed.data;

    // Calculate total score
    const scores = {
      revenueScore: data.revenueScore ?? 5,
      easeScore: data.easeScore ?? 5,
      synergyScore: data.synergyScore ?? 5,
      speedScore: data.speedScore ?? 5,
      riskScore: data.riskScore ?? 5,
    };
    const scoreResult = calculateScore(scores);

    let slug = slugify(title);
    const existing = await db.sideProject.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const project = await db.sideProject.create({
      data: {
        title,
        slug,
        ...data,
        ...scores,
        totalScore: scoreResult.total,
        tags: tags ?? [],
        techStack: techStack ?? [],
        competitors: competitors ?? [],
        launchDate: launchDate ? new Date(launchDate) : undefined,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        votes: { select: { userId: true } },
        _count: { select: { tasks: true, notes: true, links: true, votes: true } },
      },
    });

    // Activity log
    await db.sideProjectActivity.create({
      data: {
        sideProjectId: project.id,
        userId: session.user.id,
        action: "created",
        details: { title },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[SIDE_PROJECTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

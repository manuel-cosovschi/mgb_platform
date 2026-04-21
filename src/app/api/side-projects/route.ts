import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { calculateScore } from "@/lib/side-projects/score-engine";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const createSchema = z.object({
  title: z.string().min(1),
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
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const page = parseInt(searchParams.get("page") ?? "1");
    const orderBy = searchParams.get("orderBy") ?? "createdAt";
    const order = searchParams.get("order") ?? "desc";

    const where: Record<string, unknown> = { active: true };
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { problem: { contains: search, mode: "insensitive" } },
      ];
    }

    const validOrderFields = ["createdAt", "updatedAt", "score", "priorityOrder", "title"];
    const sortField = validOrderFields.includes(orderBy) ? orderBy : "createdAt";

    const [items, total] = await Promise.all([
      db.sideProject.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortField]: order === "asc" ? "asc" : "desc" },
        include: {
          owner: { select: { id: true, name: true, image: true } },
          votes: { select: { userId: true, value: true } },
          _count: { select: { tasks: true, notes: true } },
        },
      }),
      db.sideProject.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
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
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, ...data } = parsed.data;

    let slug = slugify(title);
    const existing = await db.sideProject.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const complexity = data.complexity ?? 5;
    const revenuePotential = data.revenuePotential ?? 5;
    const synergy = data.synergy ?? 5;
    const risk = data.risk ?? "MEDIUM";
    const timeEstimate = data.timeEstimate;

    const { score } = calculateScore({ complexity, revenuePotential, synergy, timeEstimate, risk });

    const maxOrder = await db.sideProject.aggregate({ _max: { priorityOrder: true } });
    const priorityOrder = (maxOrder._max.priorityOrder ?? 0) + 1;

    const project = await db.sideProject.create({
      data: {
        title,
        slug,
        ...data,
        score,
        priorityOrder,
        ownerId: session.user.id,
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
      },
    });

    await db.sideProjectActivityLog.create({
      data: {
        sideProjectId: project.id,
        userId: session.user.id,
        action: "CREATED",
        metadata: { title },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[SIDE_PROJECTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

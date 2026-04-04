import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  stage: z.enum(["LEAD","CONTACTED","PROPOSAL_SENT","NEGOTIATION","WON","LOST"]).optional(),
  score: z.enum(["LOW","MEDIUM","HIGH"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const score = searchParams.get("score");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");

    const where: any = { isActive: true };
    if (stage) where.stage = stage;
    if (score) where.score = score;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tags) {
      where.tags = { hasSome: tags.split(",") };
    }

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { projects: true, interactions: true } },
        },
      }),
      db.client.count({ where }),
    ]);

    return NextResponse.json({
      data: clients,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[CLIENTS_GET]", error);
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
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const client = await db.client.create({ data: parsed.data });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Client",
        entityId: client.id,
        newValues: { name: client.name },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("[CLIENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

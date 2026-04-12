import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  businessName: z.string().min(1, "El nombre del negocio es requerido"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  service: z.string().optional(),
  status: z.enum(["POTENTIAL", "CONTACTED", "IN_TALKS", "IN_DEVELOPMENT", "DEPOSIT_PAID", "COMPLETED", "REJECTED"]).optional(),
  notes: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.enum(["ARS", "USD", "EUR"]).optional(),
  firstContactAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const where: any = {};

  if (search) {
    where.businessName = { contains: search, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }

  const [prospects, total] = await Promise.all([
    db.prospect.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { updatedAt: "desc" },
    }),
    db.prospect.count({ where }),
  ]);

  return NextResponse.json({
    data: prospects,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { budget, firstContactAt, email, ...data } = parsed.data;

  const prospect = await db.prospect.create({
    data: {
      ...data,
      email: email || undefined,
      budget: budget ?? undefined,
      firstContactAt: firstContactAt ? new Date(firstContactAt) : undefined,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(prospect, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
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
  stage: z.enum(["LEAD", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  score: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id, isActive: true },
    include: {
      interactions: {
        orderBy: { date: "desc" },
        take: 50,
      },
      projects: {
        select: { id: true, name: true, slug: true, status: true, priority: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { projects: true, interactions: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await db.client.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(client);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await db.client.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true });
}

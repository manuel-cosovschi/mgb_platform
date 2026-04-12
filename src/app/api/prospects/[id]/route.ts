import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  businessName: z.string().min(1).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  service: z.string().optional(),
  status: z.enum(["POTENTIAL", "CONTACTED", "IN_TALKS", "IN_DEVELOPMENT", "DEPOSIT_PAID", "COMPLETED", "REJECTED"]).optional(),
  notes: z.string().optional(),
  budget: z.number().positive().optional().nullable(),
  currency: z.enum(["ARS", "USD", "EUR"]).optional(),
  firstContactAt: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.prospect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { budget, firstContactAt, email, status, ...rest } = parsed.data;

  // Auto-set closedAt when moving to a terminal status
  const CLOSED_STATUSES = ["COMPLETED", "REJECTED"];
  const wasOpen = !CLOSED_STATUSES.includes(existing.status);
  const isClosing = status && CLOSED_STATUSES.includes(status);
  const isReopening = status && !CLOSED_STATUSES.includes(status);

  const closedAt =
    isClosing && wasOpen
      ? new Date()
      : isReopening
      ? null
      : undefined;

  const prospect = await db.prospect.update({
    where: { id },
    data: {
      ...rest,
      ...(status !== undefined && { status }),
      ...(email !== undefined && { email: email || null }),
      ...(budget !== undefined && { budget: budget ?? null }),
      ...(firstContactAt !== undefined && {
        firstContactAt: firstContactAt ? new Date(firstContactAt) : null,
      }),
      ...(closedAt !== undefined && { closedAt }),
    },
  });

  return NextResponse.json(prospect);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.prospect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.prospect.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

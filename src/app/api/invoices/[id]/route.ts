import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true, taxId: true, address: true } },
      project: { select: { id: true, name: true } },
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const invoice = await db.invoice.update({
    where: { id },
    data: {
      status: body.status,
      paidDate: body.status === "PAID" && !body.paidDate ? new Date() : body.paidDate ? new Date(body.paidDate) : undefined,
      sentAt: body.status === "SENT" ? new Date() : undefined,
      notes: body.notes,
    },
  });

  await db.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "Invoice", entityId: id, newValues: { status: body.status } },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employee = await db.employee.findUnique({ where: { id }, select: { userId: true } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete the user (cascades to employee profile)
  await db.user.delete({ where: { id: employee.userId } });

  await db.auditLog.create({
    data: { userId: session.user.id, action: "DELETE", entity: "Employee", entityId: id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const employee = await db.employee.update({
    where: { id },
    data: body,
    include: { user: true },
  });

  return NextResponse.json(employee);
}

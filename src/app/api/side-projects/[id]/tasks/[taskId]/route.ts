import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  phase: z.string().optional(),
  order: z.number().optional(),
});

type Params = { params: Promise<{ id: string; taskId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await db.sideProjectTask.update({ where: { id: taskId }, data: parsed.data });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  await db.sideProjectTask.delete({ where: { id: taskId } });
  return NextResponse.json({ success: true });
}

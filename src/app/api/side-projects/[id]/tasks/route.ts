import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  phase: z.string().optional(),
  order: z.number().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tasks = await db.sideProjectTask.findMany({
    where: { sideProjectId: id },
    orderBy: [{ phase: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const maxOrder = await db.sideProjectTask.aggregate({
    where: { sideProjectId: id, phase: parsed.data.phase },
    _max: { order: true },
  });

  const task = await db.sideProjectTask.create({
    data: {
      sideProjectId: id,
      ...parsed.data,
      order: parsed.data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

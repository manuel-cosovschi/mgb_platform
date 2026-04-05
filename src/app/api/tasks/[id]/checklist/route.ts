import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  const last = await db.taskChecklistItem.findFirst({ where: { taskId: id }, orderBy: { order: "desc" } });

  const item = await db.taskChecklistItem.create({
    data: { taskId: id, title, order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, isCompleted } = await req.json();
  const item = await db.taskChecklistItem.update({
    where: { id: itemId },
    data: { isCompleted, completedAt: isCompleted ? new Date() : null },
  });

  return NextResponse.json(item);
}

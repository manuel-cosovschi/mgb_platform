import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;
const noteSchema = z.object({ content: z.string().min(1) });

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notes = await db.sideProjectNote.findMany({
    where: { sideProjectId: id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const note = await db.sideProjectNote.create({
    data: { sideProjectId: id, authorId: session.user.id, content: parsed.data.content },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}

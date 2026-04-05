import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const messages = await db.message.findMany({
    where: { channelId: id, isDeleted: false },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  // Map sender -> author for the frontend
  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      author: m.sender,
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }

  const message = await db.message.create({
    data: {
      content: content.trim(),
      channelId: id,
      senderId: session.user.id,
    },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  return NextResponse.json(
    { id: message.id, content: message.content, createdAt: message.createdAt, author: message.sender },
    { status: 201 }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notes = await db.sideProjectNote.findMany({
      where: { sideProjectId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[SP_NOTES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const note = await db.sideProjectNote.create({
      data: {
        sideProjectId: id,
        content: body.content,
        authorId: session.user.id,
      },
    });

    await db.sideProjectActivity.create({
      data: {
        sideProjectId: id,
        userId: session.user.id,
        action: "note_added",
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[SP_NOTES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

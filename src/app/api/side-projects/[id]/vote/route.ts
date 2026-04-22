import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Toggle vote
    const existing = await db.sideProjectVote.findUnique({
      where: {
        sideProjectId_userId: {
          sideProjectId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await db.sideProjectVote.delete({ where: { id: existing.id } });
      return NextResponse.json({ voted: false });
    } else {
      await db.sideProjectVote.create({
        data: {
          sideProjectId: id,
          userId: session.user.id,
        },
      });

      await db.sideProjectActivity.create({
        data: {
          sideProjectId: id,
          userId: session.user.id,
          action: "voted",
        },
      });

      return NextResponse.json({ voted: true });
    }
  } catch (error) {
    console.error("[SP_VOTE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: { id: string; priority: string; pipelineOrder: number }[] };

    if (!items?.length) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    // Update all items in parallel
    await Promise.all(
      items.map((item) =>
        db.sideProject.update({
          where: { id: item.id },
          data: {
            priority: item.priority as "P1_NOW" | "P2_NEXT" | "P3_LATER" | "P4_MAYBE" | "P5_SOMEDAY",
            pipelineOrder: item.pipelineOrder,
          },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SP_REORDER_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

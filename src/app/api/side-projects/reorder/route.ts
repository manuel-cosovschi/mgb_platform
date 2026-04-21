import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), priorityOrder: z.number() })),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    await Promise.all(
      parsed.data.items.map((item) =>
        db.sideProject.update({
          where: { id: item.id },
          data: { priorityOrder: item.priorityOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SIDE_PROJECTS_REORDER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

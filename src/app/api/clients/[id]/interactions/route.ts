import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "WHATSAPP", "OTHER"]),
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().datetime(),
  duration: z.number().int().positive().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: clientId } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const interaction = await db.cRMInteraction.create({
    data: {
      clientId,
      createdById: session.user.id,
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });

  return NextResponse.json(interaction, { status: 201 });
}

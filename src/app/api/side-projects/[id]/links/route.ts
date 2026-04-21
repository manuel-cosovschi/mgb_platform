import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const linkSchema = z.object({
  type: z.enum(["DRIVE", "NOTION", "FIGMA", "GITHUB", "DOMAIN", "HOSTING", "OTHER"]),
  label: z.string().optional(),
  url: z.string().url(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const links = await db.sideProjectLink.findMany({ where: { sideProjectId: id } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const link = await db.sideProjectLink.create({
    data: { sideProjectId: id, ...parsed.data },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });

  await params; // ensure params resolved
  await db.sideProjectLink.delete({ where: { id: linkId } });
  return NextResponse.json({ success: true });
}

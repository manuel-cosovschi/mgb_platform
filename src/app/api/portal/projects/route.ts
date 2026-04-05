import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await db.client.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!client) return NextResponse.json([]);

  const projects = await db.project.findMany({
    where: { clientId: client.id },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        select: { status: true },
        where: { status: "DONE" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

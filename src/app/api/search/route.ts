import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ clients: [], projects: [], tasks: [], documents: [] });
  }

  const isCliente = session.user.role === "CLIENTE";
  const isSocio = session.user.role === "SOCIO";

  const [clients, projects, tasks, documents] = await Promise.all([
    // Clients — only SOCIO/EMPLEADO
    !isCliente
      ? db.client.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, company: true, email: true },
          take: 5,
        })
      : [],

    // Projects
    db.project.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(isCliente && {
          client: { userId: session.user.id },
        }),
      },
      select: { id: true, name: true, slug: true, status: true, client: { select: { name: true } } },
      take: 5,
    }),

    // Tasks
    db.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(isCliente && {
          project: { client: { userId: session.user.id } },
        }),
        ...(!isSocio && !isCliente && {
          assignments: { some: { userId: session.user.id } },
        }),
      },
      select: {
        id: true, title: true, status: true,
        project: { select: { name: true, slug: true } },
      },
      take: 5,
    }),

    // Documents
    db.document.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        deletedAt: null,
      },
      select: { id: true, name: true, type: true, folderId: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ clients, projects, tasks, documents });
}

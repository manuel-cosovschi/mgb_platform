import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  budgetCurrency: z.enum(["ARS", "USD", "EUR"]).optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("search");
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (clientId) where.clientId = clientId;

    // Empleados solo ven proyectos donde son miembros
    if (session.user.role === "EMPLEADO") {
      where.members = {
        some: {
          employee: { userId: session.user.id },
        },
      };
    }
    // Clientes solo ven proyectos asociados a su perfil
    if (session.user.role === "CLIENTE") {
      where.isPublicToClient = true;
      where.client = { userId: session.user.id };
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { id: true, name: true, company: true } },
          creator: { select: { id: true, name: true, image: true } },
          members: {
            take: 5,
            include: {
              employee: {
                include: { user: { select: { id: true, name: true, image: true } } },
              },
            },
          },
          _count: { select: { tasks: true } },
        },
      }),
      db.project.count({ where }),
    ]);

    // Calcular progreso de tareas para cada proyecto
    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => {
        const [doneTasks, totalTasks] = await Promise.all([
          db.task.count({ where: { projectId: p.id, status: "DONE" } }),
          db.task.count({ where: { projectId: p.id } }),
        ]);
        return {
          ...p,
          taskProgress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        };
      })
    );

    return NextResponse.json({
      data: projectsWithProgress,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, memberIds, ...data } = parsed.data;

    // Generar slug único
    let slug = slugify(name);
    const existing = await db.project.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const project = await db.project.create({
      data: {
        name,
        slug,
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        creatorId: session.user.id,
        columns: {
          createMany: {
            data: [
              { name: "Backlog", order: 0 },
              { name: "Por hacer", order: 1 },
              { name: "En progreso", order: 2 },
              { name: "En revisión", order: 3 },
              { name: "Completado", order: 4 },
            ],
          },
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        columns: true,
      },
    });

    // Log de auditoría
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
        newValues: { name, slug },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

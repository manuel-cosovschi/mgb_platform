import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-time seed endpoint — protected by secret key
// Call with: GET /api/seed?secret=mgb-seed-2024
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "mgb-seed-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already seeded
  const userCount = await db.user.count();
  if (userCount > 0) {
    return NextResponse.json({ message: `Already seeded — ${userCount} users exist.` });
  }

  try {
    // Company settings
    await db.companySettings.create({
      data: {
        name: "MGB Software Factory",
        email: "info@mgbsoftware.com",
        invoicePrefix: "FAC",
        invoiceNextNumber: 1,
      },
    });

    // Partners
    const hash = (pw: string) => bcrypt.hash(pw, 12);
    const [manuel, gabriel, bruno] = await Promise.all([
      db.user.create({
        data: {
          name: "Manuel Cosovschi",
          email: "manu@mgb.dev",
          password: await hash("MGB2024!"),
          role: "SOCIO",
        },
      }),
      db.user.create({
        data: {
          name: "Gabriel García Vázquez",
          email: "gabi@mgb.dev",
          password: await hash("MGB2024!"),
          role: "SOCIO",
        },
      }),
      db.user.create({
        data: {
          name: "Bruno Nicolás Romano",
          email: "bruno@mgb.dev",
          password: await hash("MGB2024!"),
          role: "SOCIO",
        },
      }),
    ]);

    await Promise.all([
      db.partner.create({ data: { userId: manuel.id, equityPercentage: 33.33, title: "CEO" } }),
      db.partner.create({ data: { userId: gabriel.id, equityPercentage: 33.33, title: "CTO" } }),
      db.partner.create({ data: { userId: bruno.id, equityPercentage: 33.34, title: "COO" } }),
    ]);

    // Employees
    const [sofia, lucas] = await Promise.all([
      db.user.create({
        data: {
          name: "Sofía Martínez",
          email: "sofia@mgb.dev",
          password: await hash("Empleado2024!"),
          role: "EMPLEADO",
        },
      }),
      db.user.create({
        data: {
          name: "Lucas Fernández",
          email: "lucas@mgb.dev",
          password: await hash("Empleado2024!"),
          role: "EMPLEADO",
        },
      }),
    ]);

    await Promise.all([
      db.employee.create({ data: { userId: sofia.id, jobTitle: "Frontend Developer", department: "Frontend", startDate: new Date("2023-03-01") } }),
      db.employee.create({ data: { userId: lucas.id, jobTitle: "Backend Developer", department: "Backend", startDate: new Date("2023-06-01") } }),
    ]);

    // Clients
    await db.client.createMany({
      data: [
        { id: "client-tecnoar", name: "Carlos Rodríguez", company: "TecnoAR S.A.", email: "contacto@tecnoar.com", stage: "WON", score: "HIGH", tags: ["SaaS", "Enterprise"] },
        { id: "client-startupnova", name: "Martín López", company: "StartupNova", email: "hola@startupnova.io", stage: "NEGOTIATION", score: "HIGH", tags: ["Startup", "FinTech"] },
        { id: "client-medtech", name: "Laura Méndez", company: "MedTech 360", email: "contacto@medtech360.com", stage: "CONTACTED", score: "HIGH", tags: ["Salud", "SaaS"] },
      ],
    });

    // Project
    const project = await db.project.create({
      data: {
        name: "MGB Hub Platform",
        slug: "mgb-hub-platform",
        description: "Plataforma all-in-one interna de MGB Software Factory",
        clientId: "client-tecnoar",
        creatorId: manuel.id,
        status: "ACTIVE",
        priority: "HIGH",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        isPublicToClient: true,
      },
    });

    // Kanban columns
    await db.kanbanColumn.createMany({
      data: [
        { projectId: project.id, name: "Backlog", order: 0, color: "#94a3b8" },
        { projectId: project.id, name: "En progreso", order: 1, color: "#6366f1" },
        { projectId: project.id, name: "En revisión", order: 2, color: "#f59e0b" },
        { projectId: project.id, name: "Completado", order: 3, color: "#10b981" },
      ],
    });

    // Chat channel
    await db.channel.create({
      data: {
        name: "general",
        description: "Canal general del equipo",
        isPrivate: false,
        createdById: manuel.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Seed completado",
      data: {
        users: await db.user.count(),
        clients: await db.client.count(),
        projects: await db.project.count(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

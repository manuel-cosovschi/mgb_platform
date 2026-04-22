import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // ──────────────────────────────────────────
  // COMPANY SETTINGS
  // ──────────────────────────────────────────
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "MGB",
      legalName: "MGB Software Factory SRL",
      taxId: "30-12345678-9",
      email: "hola@mgb.dev",
      phone: "+54 11 5555-0000",
      address: "Av. Corrientes 1234",
      city: "Buenos Aires",
      country: "Argentina",
      website: "https://mgb.dev",
      primaryColor: "#6366f1",
      invoicePrefix: "FAC",
      invoiceNextNumber: 1,
    },
  });

  // ──────────────────────────────────────────
  // SOCIOS
  // ──────────────────────────────────────────
  const password = await bcrypt.hash("MGB2024!", 12);

  const [manuel, gabriel, bruno] = await Promise.all([
    prisma.user.upsert({
      where: { email: "manu@mgb.dev" },
      update: {},
      create: {
        name: "Manuel Cosovschi",
        email: "manu@mgb.dev",
        password,
        role: "SOCIO",
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "gabi@mgb.dev" },
      update: {},
      create: {
        name: "Gabriel García Vázquez",
        email: "gabi@mgb.dev",
        password,
        role: "SOCIO",
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "bruno@mgb.dev" },
      update: {},
      create: {
        name: "Bruno Nicolás Romano",
        email: "bruno@mgb.dev",
        password,
        role: "SOCIO",
        isActive: true,
      },
    }),
  ]);

  // Partner profiles
  await prisma.partner.upsert({
    where: { userId: manuel.id },
    update: {},
    create: {
      userId: manuel.id,
      equityPercentage: 33.33,
      title: "CEO / Fullstack Dev",
      specialties: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
      bio: "CEO y desarrollador fullstack de MGB. Especialista en arquitectura de software y producto.",
    },
  });

  await prisma.partner.upsert({
    where: { userId: gabriel.id },
    update: {},
    create: {
      userId: gabriel.id,
      equityPercentage: 33.33,
      title: "CTO / Frontend Lead",
      specialties: ["React", "TypeScript", "UI/UX", "Tailwind CSS"],
      bio: "CTO y líder de frontend. Apasionado por las interfaces de usuario y la experiencia de usuario.",
    },
  });

  await prisma.partner.upsert({
    where: { userId: bruno.id },
    update: {},
    create: {
      userId: bruno.id,
      equityPercentage: 33.33,
      title: "COO / Backend Lead",
      specialties: ["Node.js", "Python", "AWS", "DevOps", "Databases"],
      bio: "COO y líder de backend. Especialista en infraestructura, bases de datos y procesos internos.",
    },
  });

  console.log("✅ Socios creados");

  // ──────────────────────────────────────────
  // EMPLEADOS
  // ──────────────────────────────────────────
  const employeePassword = await bcrypt.hash("Empleado2024!", 12);

  const emp1User = await prisma.user.upsert({
    where: { email: "sofia@mgb.dev" },
    update: {},
    create: {
      name: "Sofía Martínez",
      email: "sofia@mgb.dev",
      password: employeePassword,
      role: "EMPLEADO",
      isActive: true,
    },
  });

  const emp2User = await prisma.user.upsert({
    where: { email: "lucas@mgb.dev" },
    update: {},
    create: {
      name: "Lucas Fernández",
      email: "lucas@mgb.dev",
      password: employeePassword,
      role: "EMPLEADO",
      isActive: true,
    },
  });

  const [sofia, lucas] = await Promise.all([
    prisma.employee.upsert({
      where: { userId: emp1User.id },
      update: {},
      create: {
        userId: emp1User.id,
        jobTitle: "Frontend Developer",
        department: "Desarrollo",
        employmentType: "FULL_TIME",
        startDate: new Date("2023-03-01"),
        salary: 450000,
        salaryCurrency: "ARS",
        skills: ["React", "TypeScript", "Tailwind CSS", "Figma"],
      },
    }),
    prisma.employee.upsert({
      where: { userId: emp2User.id },
      update: {},
      create: {
        userId: emp2User.id,
        jobTitle: "Backend Developer",
        department: "Desarrollo",
        employmentType: "FULL_TIME",
        startDate: new Date("2023-06-15"),
        salary: 480000,
        salaryCurrency: "ARS",
        skills: ["Node.js", "Express", "PostgreSQL", "Redis"],
      },
    }),
  ]);

  console.log("✅ Empleados creados");

  // ──────────────────────────────────────────
  // CLIENTES
  // ──────────────────────────────────────────
  await prisma.client.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "client-tecnoar",
        name: "Carlos Rodríguez",
        company: "TecnoAR S.A.",
        taxId: "30-11111111-1",
        email: "contacto@tecnoar.com",
        phone: "+54 11 4444-0001",
        city: "Buenos Aires",
        industry: "Tecnología",
        companySize: "51-200",
        stage: "WON",
        score: "HIGH",
        tags: ["SaaS", "Enterprise", "Tech"],
        notes: "Cliente estrella. Gran potencial de upsell. Muy satisfecho con el servicio.",
      },
      {
        id: "client-comercialsur",
        name: "Ana González",
        company: "Comercial Sur S.R.L.",
        taxId: "30-22222222-2",
        email: "info@comercialsur.com.ar",
        phone: "+54 11 4444-0002",
        city: "Córdoba",
        industry: "Retail",
        companySize: "11-50",
        stage: "PROPOSAL_SENT",
        score: "MEDIUM",
        tags: ["Retail", "eCommerce"],
        notes: "E-commerce en crecimiento. Necesitan soporte continuo.",
      },
      {
        id: "client-startupnova",
        name: "Martín López",
        company: "StartupNova",
        taxId: "30-33333333-3",
        email: "hola@startupnova.io",
        phone: "+54 11 4444-0003",
        city: "Buenos Aires",
        industry: "FinTech",
        companySize: "1-10",
        stage: "NEGOTIATION",
        score: "HIGH",
        tags: ["Startup", "FinTech", "MVP"],
        notes: "Startup en ronda seed. Necesitan MVP en 3 meses.",
      },
      {
        id: "client-parana",
        name: "Roberto Sánchez",
        company: "Constructora Paraná",
        taxId: "30-44444444-4",
        email: "ventas@constructoraparana.com",
        phone: "+54 343 555-0004",
        city: "Paraná",
        industry: "Construcción",
        companySize: "51-200",
        stage: "PROPOSAL_SENT",
        score: "MEDIUM",
        tags: ["Construcción", "ERP"],
      },
      {
        id: "client-medtech",
        name: "Laura Méndez",
        company: "MedTech 360",
        taxId: "30-55555555-5",
        email: "contacto@medtech360.com",
        phone: "+54 11 4444-0005",
        city: "Buenos Aires",
        industry: "Salud",
        companySize: "11-50",
        stage: "CONTACTED",
        score: "HIGH",
        tags: ["Salud", "HealthTech", "SaaS"],
      },
    ],
  });

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });

  console.log("✅ Clientes creados");

  // ──────────────────────────────────────────
  // PROYECTOS
  // ──────────────────────────────────────────

  // Usuarios empleados para relaciones
  const manuelEmployee = await prisma.employee.findFirst({ where: { userId: manuel.id } });
  const gabrielEmployee = await prisma.employee.findFirst({ where: { userId: gabriel.id } });
  const brunoEmployee = await prisma.employee.findFirst({ where: { userId: bruno.id } });

  const project1 = await prisma.project.upsert({
    where: { slug: "plataforma-ecommerce-tecnoar" },
    update: {},
    create: {
      name: "Plataforma eCommerce TecnoAR",
      slug: "plataforma-ecommerce-tecnoar",
      description: "Desarrollo de plataforma ecommerce completa con panel de administración, pasarela de pagos y app móvil.",
      clientId: clients[0].id,
      creatorId: manuel.id,
      status: "ACTIVE",
      priority: "HIGH",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-06-30"),
      budget: 2500000,
      budgetCurrency: "ARS",
      isPublicToClient: true,
      coverColor: "#6366f1",
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
    include: { columns: true },
  });

  const project2 = await prisma.project.upsert({
    where: { slug: "app-mobile-comercial-sur" },
    update: {},
    create: {
      name: "App Mobile Comercial Sur",
      slug: "app-mobile-comercial-sur",
      description: "Aplicación móvil para gestión de inventario y ventas del equipo de campo.",
      clientId: clients[1].id,
      creatorId: gabriel.id,
      status: "ACTIVE",
      priority: "MEDIUM",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-05-31"),
      budget: 1200000,
      budgetCurrency: "ARS",
      isPublicToClient: true,
      coverColor: "#10b981",
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
    include: { columns: true },
  });

  const project3 = await prisma.project.upsert({
    where: { slug: "mvp-fintech-startupnova" },
    update: {},
    create: {
      name: "MVP FinTech StartupNova",
      slug: "mvp-fintech-startupnova",
      description: "Desarrollo del MVP de plataforma fintech: billetera virtual, transferencias P2P y gestión de cuentas.",
      clientId: clients[2].id,
      creatorId: bruno.id,
      status: "PLANNING",
      priority: "URGENT",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-07-31"),
      budget: 3500000,
      budgetCurrency: "ARS",
      isPublicToClient: true,
      coverColor: "#f59e0b",
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
    include: { columns: true },
  });

  console.log("✅ Proyectos creados");

  // ──────────────────────────────────────────
  // TAREAS (proyecto 1)
  // ──────────────────────────────────────────
  const p1Columns = project1.columns;
  const colBacklog = p1Columns.find((c) => c.name === "Backlog")!;
  const colTodo = p1Columns.find((c) => c.name === "Por hacer")!;
  const colInProgress = p1Columns.find((c) => c.name === "En progreso")!;
  const colDone = p1Columns.find((c) => c.name === "Completado")!;

  const tasksProject1 = [
    { title: "Diseño de wireframes", status: "DONE" as const, columnId: colDone.id, priority: "HIGH" as const, estimatedHours: 16, actualHours: 18, assigneeId: gabriel.id },
    { title: "Setup del entorno de desarrollo", status: "DONE" as const, columnId: colDone.id, priority: "HIGH" as const, estimatedHours: 4, actualHours: 3, assigneeId: bruno.id },
    { title: "Diseño de la base de datos", status: "DONE" as const, columnId: colDone.id, priority: "HIGH" as const, estimatedHours: 8, actualHours: 10, assigneeId: bruno.id },
    { title: "Módulo de autenticación", status: "IN_PROGRESS" as const, columnId: colInProgress.id, priority: "HIGH" as const, estimatedHours: 12, assigneeId: manuel.id },
    { title: "Catálogo de productos", status: "IN_PROGRESS" as const, columnId: colInProgress.id, priority: "HIGH" as const, estimatedHours: 24, assigneeId: emp1User.id },
    { title: "Carrito de compras", status: "TODO" as const, columnId: colTodo.id, priority: "HIGH" as const, estimatedHours: 16, assigneeId: emp2User.id },
    { title: "Integración con MercadoPago", status: "TODO" as const, columnId: colTodo.id, priority: "URGENT" as const, estimatedHours: 20, assigneeId: bruno.id },
    { title: "Panel de administración", status: "BACKLOG" as const, columnId: colBacklog.id, priority: "MEDIUM" as const, estimatedHours: 40, assigneeId: gabriel.id },
    { title: "Testing E2E", status: "BACKLOG" as const, columnId: colBacklog.id, priority: "MEDIUM" as const, estimatedHours: 16, assigneeId: emp1User.id },
    { title: "Deploy en producción", status: "BACKLOG" as const, columnId: colBacklog.id, priority: "HIGH" as const, estimatedHours: 8, assigneeId: bruno.id },
  ];

  for (let i = 0; i < tasksProject1.length; i++) {
    const { assigneeId, ...taskData } = tasksProject1[i];
    await prisma.task.create({
      data: {
        ...taskData,
        projectId: project1.id,
        order: i,
        createdById: manuel.id,
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        completedAt: taskData.status === "DONE" ? new Date() : undefined,
        assignments: {
          create: { userId: assigneeId },
        },
      },
    });
  }

  console.log("✅ Tareas creadas");

  // ──────────────────────────────────────────
  // FACTURAS
  // ──────────────────────────────────────────
  const invoices = [
    {
      number: "FAC-2024-0001",
      clientId: clients[0].id,
      projectId: project1.id,
      status: "PAID" as const,
      currency: "ARS" as const,
      issueDate: new Date("2024-01-31"),
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-10"),
      items: [
        { description: "Diseño UX/UI - Enero", quantity: 1, unitPrice: 150000 },
        { description: "Desarrollo backend - Enero", quantity: 80, unitPrice: 2000 },
      ],
    },
    {
      number: "FAC-2024-0002",
      clientId: clients[0].id,
      projectId: project1.id,
      status: "PAID" as const,
      currency: "ARS" as const,
      issueDate: new Date("2024-02-29"),
      dueDate: new Date("2024-03-15"),
      paidDate: new Date("2024-03-08"),
      items: [
        { description: "Desarrollo fullstack - Febrero", quantity: 160, unitPrice: 2000 },
      ],
    },
    {
      number: "FAC-2024-0003",
      clientId: clients[1].id,
      projectId: project2.id,
      status: "SENT" as const,
      currency: "ARS" as const,
      issueDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-20"),
      items: [
        { description: "App Mobile - Sprint 1", quantity: 1, unitPrice: 400000 },
        { description: "Diseño de interfaz", quantity: 1, unitPrice: 120000 },
      ],
    },
    {
      number: "FAC-2024-0004",
      clientId: clients[2].id,
      status: "OVERDUE" as const,
      currency: "ARS" as const,
      issueDate: new Date("2024-02-15"),
      dueDate: new Date("2024-03-01"),
      items: [
        { description: "Consultoría técnica - MVP", quantity: 20, unitPrice: 8000 },
      ],
    },
  ];

  for (const inv of invoices) {
    const existing = await prisma.invoice.findUnique({ where: { number: inv.number } });
    if (existing) continue;

    const { items, ...invData } = inv;
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxRate = 21;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    await prisma.invoice.create({
      data: {
        ...invData,
        subtotal,
        taxRate,
        taxAmount,
        total,
        createdById: manuel.id,
        items: {
          createMany: {
            data: items.map((item, i) => ({
              ...item,
              total: item.quantity * item.unitPrice,
              order: i,
            })),
          },
        },
      },
    });
  }

  console.log("✅ Facturas creadas");

  // ──────────────────────────────────────────
  // GASTOS
  // ──────────────────────────────────────────
  const expenses = [
    { category: "HOSTING" as const, description: "Vercel Pro Plan", amount: 25000, date: new Date("2024-03-01"), isRecurring: true },
    { category: "HOSTING" as const, description: "Supabase Pro", amount: 30000, date: new Date("2024-03-01"), isRecurring: true },
    { category: "TOOLS" as const, description: "Linear (anual)", amount: 120000, date: new Date("2024-01-15") },
    { category: "TOOLS" as const, description: "Figma (anual)", amount: 90000, date: new Date("2024-01-15") },
    { category: "OFFICE" as const, description: "Coworking WeWork", amount: 180000, date: new Date("2024-03-01"), isRecurring: true },
    { category: "MARKETING" as const, description: "Google Ads - Campaña Q1", amount: 85000, date: new Date("2024-02-01") },
    { category: "TAXES" as const, description: "Monotributo - Febrero", amount: 45000, date: new Date("2024-02-20") },
    { category: "TAXES" as const, description: "Monotributo - Marzo", amount: 45000, date: new Date("2024-03-20") },
  ];

  for (const exp of expenses) {
    await prisma.expense.create({ data: { ...exp, createdById: manuel.id } });
  }

  console.log("✅ Gastos creados");

  // ──────────────────────────────────────────
  // INTERACCIONES CRM
  // ──────────────────────────────────────────
  await prisma.cRMInteraction.create({
    data: {
      clientId: clients[0].id,
      type: "MEETING",
      title: "Reunión de kickoff",
      description: "Reunión de inicio del proyecto ecommerce. Se definieron alcances y timelines.",
      date: new Date("2024-01-10"),
      duration: 90,
      createdById: manuel.id,
    },
  });

  await prisma.cRMInteraction.create({
    data: {
      clientId: clients[2].id,
      type: "CALL",
      title: "Discovery call",
      description: "Llamada inicial para entender las necesidades del MVP fintech.",
      date: new Date("2024-02-20"),
      duration: 45,
      createdById: gabriel.id,
    },
  });

  await prisma.followUp.create({
    data: {
      clientId: clients[3].id,
      title: "Enviar propuesta técnica",
      description: "Preparar y enviar propuesta detallada para el sistema ERP.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: bruno.id,
    },
  });

  console.log("✅ Interacciones CRM creadas");

  // ──────────────────────────────────────────
  // CANALES DE CHAT
  // ──────────────────────────────────────────
  const generalChannel = await prisma.channel.create({
    data: {
      name: "general",
      description: "Canal general del equipo",
      createdById: manuel.id,
      members: {
        createMany: {
          data: [
            { userId: manuel.id },
            { userId: gabriel.id },
            { userId: bruno.id },
            { userId: emp1User.id },
            { userId: emp2User.id },
          ],
        },
      },
    },
  });

  await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: manuel.id,
      content: "🚀 Bienvenidos al MGB Hub! Este es nuestro canal central de comunicación.",
    },
  });

  await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: gabriel.id,
      content: "Excelente! La plataforma quedó genial. A darle para adelante! 💪",
    },
  });

  await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: bruno.id,
      content: "Todo deployado en Vercel. Las migraciones de Prisma corrieron perfecto.",
    },
  });

  console.log("✅ Canales de chat creados");

  // ──────────────────────────────────────────
  // OKRs
  // ──────────────────────────────────────────
  const companyOkr = await prisma.oKR.create({
    data: {
      title: "Consolidar MGB como referente en software B2B",
      description: "Posicionarnos en el mercado de software factory para empresas medianas.",
      ownerId: manuel.id,
      status: "ACTIVE",
      frequency: "QUARTERLY",
      period: "2024-Q1",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-03-31"),
      progress: 35,
      keyResults: {
        createMany: {
          data: [
            { title: "Facturar $5M ARS en el trimestre", targetValue: 5000000, currentValue: 1820000, unit: "ARS", progress: 36 },
            { title: "Cerrar 3 nuevos clientes", targetValue: 3, currentValue: 1, unit: "clientes", progress: 33 },
            { title: "NPS > 8 en todos los proyectos activos", targetValue: 8, currentValue: 7.5, unit: "puntos", progress: 94 },
            { title: "0 bugs críticos sin resolver por más de 48hs", targetValue: 0, currentValue: 0, unit: "bugs", progress: 100 },
          ],
        },
      },
    },
  });

  console.log("✅ OKRs creados");

  // ──────────────────────────────────────────
  // TIME ENTRIES
  // ──────────────────────────────────────────
  const timeEntries = [
    { userId: manuel.id, projectId: project1.id, description: "Reunión kickoff cliente", startTime: new Date("2024-01-10T09:00:00"), endTime: new Date("2024-01-10T10:30:00"), duration: 5400, isBillable: true },
    { userId: gabriel.id, projectId: project1.id, description: "Wireframes y mockups", startTime: new Date("2024-01-11T09:00:00"), endTime: new Date("2024-01-11T17:00:00"), duration: 28800, isBillable: true },
    { userId: bruno.id, projectId: project1.id, description: "Setup infraestructura", startTime: new Date("2024-01-12T10:00:00"), endTime: new Date("2024-01-12T14:00:00"), duration: 14400, isBillable: true },
    { userId: emp1User.id, projectId: project1.id, description: "Componentes UI catálogo", startTime: new Date("2024-01-15T09:00:00"), endTime: new Date("2024-01-15T18:00:00"), duration: 32400, isBillable: true },
    { userId: emp2User.id, projectId: project1.id, description: "API de productos", startTime: new Date("2024-01-15T09:00:00"), endTime: new Date("2024-01-15T18:00:00"), duration: 32400, isBillable: true },
    { userId: gabriel.id, projectId: project2.id, description: "Diseño app mobile", startTime: new Date("2024-02-05T09:00:00"), endTime: new Date("2024-02-05T17:00:00"), duration: 28800, isBillable: true },
    { userId: bruno.id, projectId: project2.id, description: "Setup React Native", startTime: new Date("2024-02-06T10:00:00"), endTime: new Date("2024-02-06T16:00:00"), duration: 21600, isBillable: true },
  ];

  for (const entry of timeEntries) {
    await prisma.timeEntry.create({ data: entry });
  }

  console.log("✅ Time entries creadas");

  // ──────────────────────────────────────────
  // EVENTOS DE CALENDARIO
  // ──────────────────────────────────────────
  await prisma.calendarEvent.create({
    data: {
      title: "Reunión semanal MGB",
      description: "Sync semanal de los tres socios. Review de proyectos, finanzas y próxima semana.",
      type: "MEETING",
      startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000),
      isPublic: false,
      createdById: manuel.id,
      attendees: {
        createMany: {
          data: [
            { userId: manuel.id, status: "ACCEPTED" },
            { userId: gabriel.id, status: "ACCEPTED" },
            { userId: bruno.id, status: "ACCEPTED" },
          ],
        },
      },
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: "Demo TecnoAR - Sprint 2",
      type: "MEETING",
      startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      clientId: clients[0].id,
      projectId: project1.id,
      isPublic: true,
      createdById: manuel.id,
      attendees: {
        createMany: {
          data: [
            { userId: manuel.id, status: "ACCEPTED" },
            { userId: gabriel.id, status: "ACCEPTED" },
          ],
        },
      },
    },
  });

  console.log("✅ Eventos de calendario creados");

  // ──────────────────────────────────────────
  // AUDIT LOGS iniciales
  // ──────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: manuel.id, action: "LOGIN", entity: "User", entityId: manuel.id },
      { userId: gabriel.id, action: "LOGIN", entity: "User", entityId: gabriel.id },
      { userId: bruno.id, action: "LOGIN", entity: "User", entityId: bruno.id },
      { userId: manuel.id, action: "CREATE", entity: "Project", entityId: project1.id, newValues: { name: project1.name } },
      { userId: gabriel.id, action: "CREATE", entity: "Project", entityId: project2.id, newValues: { name: project2.name } },
      { userId: bruno.id, action: "CREATE", entity: "Project", entityId: project3.id, newValues: { name: project3.name } },
    ],
  });

  console.log("✅ Audit logs creados");

  // ──────────────────────────────────────────
  // SIDE PROJECTS
  // ──────────────────────────────────────────
  const sideProjectsData = [
    {
      title: "Sistema de Turnos para Barberías",
      slug: "turnos-barberias",
      description: "App de reservas con panel de barbero, pagos y recordatorios por WhatsApp",
      problem: "Las barberías pierden clientes por esperas largas y cancelaciones",
      solution: "Sistema automatizado de turnos con confirmación por WhatsApp",
      targetAudience: "Barberías y peluquerías",
      status: "EVALUATING" as const,
      type: "SAAS" as const,
      priority: "P2_NEXT" as const,
      complexity: "SIMPLE" as const,
      revenueScore: 7, easeScore: 8, synergyScore: 9, speedScore: 7, riskScore: 7,
      totalScore: 76,
      emoji: "💈", color: "#6366f1",
      tags: ["turnos", "barbería", "whatsapp"],
      techStack: ["Next.js", "Prisma", "WhatsApp API"],
      competitors: ["Calendly", "Booksy"],
    },
    {
      title: "Gestión para Gimnasios",
      slug: "gestion-gimnasios",
      description: "ERP con control de acceso, pagos recurrentes y rutinas personalizadas",
      problem: "Gimnasios usan Excel y pierden trazabilidad de pagos y asistencia",
      solution: "Plataforma integral con control de acceso NFC y gestión de cobros",
      targetAudience: "Gimnasios y centros de fitness",
      status: "IDEA" as const,
      type: "SAAS" as const,
      priority: "P3_LATER" as const,
      complexity: "COMPLEX" as const,
      revenueScore: 8, easeScore: 6, synergyScore: 8, speedScore: 5, riskScore: 6,
      totalScore: 67,
      emoji: "🏋️", color: "#10b981",
      tags: ["gimnasio", "erp", "cobros"],
      techStack: ["Next.js", "PostgreSQL", "Mercado Pago"],
      competitors: ["Gympal", "Mindbody"],
    },
    {
      title: "Menú Digital con IA para Restaurantes",
      slug: "menu-ia-restaurantes",
      description: "Menú interactivo con recomendaciones inteligentes y pedidos desde la mesa",
      problem: "Restaurantes imprimen menús costosos y no pueden actualizarlos",
      solution: "QR con menú digital + IA que sugiere platos según preferencias",
      targetAudience: "Restaurantes y bares",
      status: "APPROVED" as const,
      type: "SAAS" as const,
      priority: "P1_NOW" as const,
      complexity: "MODERATE" as const,
      revenueScore: 7, easeScore: 7, synergyScore: 7, speedScore: 8, riskScore: 7,
      totalScore: 72,
      emoji: "🍽️", color: "#f59e0b",
      tags: ["restaurantes", "menú", "ia"],
      techStack: ["Next.js", "OpenAI", "QR"],
      competitors: ["Menufy", "Yelp"],
    },
    {
      title: "Portal de Pacientes para Clínicas",
      slug: "portal-clinicas",
      description: "Historia clínica digital, turnos online y recetas electrónicas",
      problem: "Clínicas manejan historias clínicas en papel y turnos por teléfono",
      solution: "Portal web con historial, turnos y recetas",
      targetAudience: "Clínicas médicas",
      status: "IDEA" as const,
      type: "SAAS" as const,
      priority: "P4_MAYBE" as const,
      complexity: "MASSIVE" as const,
      revenueScore: 9, easeScore: 5, synergyScore: 7, speedScore: 4, riskScore: 5,
      totalScore: 63,
      emoji: "🏥", color: "#ef4444",
      tags: ["salud", "turnos", "historia-clinica"],
      techStack: ["Next.js", "PostgreSQL", "HL7 FHIR"],
      competitors: ["Doctoralia", "ClinicCloud"],
    },
    {
      title: "Bot WhatsApp para Atención al Cliente",
      slug: "bot-whatsapp-atencion",
      description: "Chatbot inteligente que responde consultas y escala a humanos",
      problem: "Empresas responden WhatsApp manualmente",
      solution: "Bot con IA que atiende 24/7 y escala conversaciones complejas",
      targetAudience: "PYMEs con alto volumen de WhatsApp",
      status: "IN_DEVELOPMENT" as const,
      type: "TOOL" as const,
      priority: "P1_NOW" as const,
      complexity: "MODERATE" as const,
      revenueScore: 8, easeScore: 6, synergyScore: 9, speedScore: 6, riskScore: 6,
      totalScore: 71,
      emoji: "🤖", color: "#8b5cf6",
      tags: ["whatsapp", "chatbot", "ia"],
      techStack: ["Node.js", "WhatsApp Business API", "OpenAI"],
      competitors: ["ManyChat", "Respond.io"],
    },
  ];

  for (const sp of sideProjectsData) {
    const existing = await prisma.sideProject.findUnique({ where: { slug: sp.slug } });
    if (existing) continue;

    await prisma.sideProject.create({
      data: {
        ...sp,
        createdById: manuel.id,
        tasks: {
          createMany: {
            data: [
              { title: "Investigar mercado", status: "DONE", order: 0 },
              { title: "Definir MVP", status: "TODO", order: 1 },
              { title: "Prototipo UI", status: "TODO", order: 2 },
            ],
          },
        },
        notes: {
          create: {
            content: `Idea discutida en reunión de socios. ${sp.description}`,
            authorId: manuel.id,
          },
        },
        votes: {
          createMany: {
            data: [{ userId: manuel.id }, { userId: gabriel.id }],
          },
        },
        activities: {
          create: {
            userId: manuel.id,
            action: "created",
            details: { title: sp.title },
          },
        },
      },
    });
  }

  console.log("✅ Side projects creados");

  console.log("\n🎉 Seed completado exitosamente!\n");
  console.log("Credenciales:");
  console.log("─────────────────────────────────────────");
  console.log("Socios (password: MGB2024!):");
  console.log("  manu@mgb.dev — Manuel Cosovschi (CEO)");
  console.log("  gabi@mgb.dev — Gabriel García Vázquez (CTO)");
  console.log("  bruno@mgb.dev — Bruno Nicolás Romano (COO)");
  console.log("\nEmpleados (password: Empleado2024!):");
  console.log("  sofia@mgb.dev — Sofía Martínez (Frontend Dev)");
  console.log("  lucas@mgb.dev — Lucas Fernández (Backend Dev)");
  console.log("─────────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

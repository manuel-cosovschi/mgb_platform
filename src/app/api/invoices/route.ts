import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  timeEntryId: z.string().optional(),
});

const createInvoiceSchema = z.object({
  clientId: z.string(),
  projectId: z.string().optional(),
  currency: z.enum(["ARS","USD","EUR"]).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    // Clientes solo ven sus facturas
    if (session.user.role === "CLIENTE") {
      where.client = { userId: session.user.id };
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { issueDate: "desc" },
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          items: true,
        },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      data: invoices,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[INVOICES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SOCIO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items, taxRate = 21, ...data } = parsed.data;

    // Obtener settings para el número de factura
    let settings = await db.companySettings.findFirst();
    if (!settings) {
      settings = await db.companySettings.create({ data: {} });
    }

    const invoiceNumber = `${settings.invoicePrefix}-${new Date().getFullYear()}-${String(settings.invoiceNextNumber).padStart(4, "0")}`;

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          ...data,
          taxRate,
          subtotal,
          taxAmount,
          total,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          createdById: session.user.id,
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
        include: {
          client: { select: { id: true, name: true } },
          items: true,
        },
      });

      // Incrementar el contador
      await tx.companySettings.update({
        where: { id: settings!.id },
        data: { invoiceNextNumber: { increment: 1 } },
      });

      return inv;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Invoice",
        entityId: invoice.id,
        newValues: { number: invoiceNumber, total },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("[INVOICES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

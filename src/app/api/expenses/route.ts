import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  category: z.enum(["HOSTING","TOOLS","SALARIES","TAXES","OFFICE","MARKETING","TRAVEL","OTHER"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["ARS","USD","EUR"]).optional(),
  date: z.string(),
  projectId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const month = searchParams.get("month");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = {};
  if (category) where.category = category;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    where.date = { gte: start, lte: end };
  }

  const [expenses, total] = await Promise.all([
    db.expense.findMany({ where, take: limit, orderBy: { date: "desc" } }),
    db.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return NextResponse.json({ data: expenses, total: Number(total._sum.amount ?? 0) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const expense = await db.expense.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), createdById: session.user.id },
  });

  await db.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Expense", entityId: expense.id },
  });

  return NextResponse.json(expense, { status: 201 });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SOCIO") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [revenue, expenses, pendingInvoices, overdueInvoices] = await Promise.all([
      db.invoice.aggregate({
        where: { status: "PAID", paidDate: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
      }),
      db.expense.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      db.invoice.aggregate({
        where: { status: { in: ["SENT"] } },
        _sum: { total: true },
      }),
      db.invoice.aggregate({
        where: { status: "OVERDUE" },
        _sum: { total: true },
      }),
    ]);

    const monthlyRevenue = Number(revenue._sum.total ?? 0);
    const monthlyExpenses = Number(expenses._sum.amount ?? 0);

    return NextResponse.json({
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      pendingInvoices: Number(pendingInvoices._sum.total ?? 0),
      overdueInvoices: Number(overdueInvoices._sum.total ?? 0),
    });
  } catch (error) {
    console.error("[FINANCE_SUMMARY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

    const data = await Promise.all(
      months.map(async (month) => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const [revenue, expenses] = await Promise.all([
          db.invoice.aggregate({
            where: { status: "PAID", paidDate: { gte: start, lte: end } },
            _sum: { total: true },
          }),
          db.expense.aggregate({
            where: { date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
        ]);

        return {
          month: format(month, "MMM", { locale: es }),
          ingresos: Number(revenue._sum.total ?? 0),
          egresos: Number(expenses._sum.amount ?? 0),
          ganancia:
            Number(revenue._sum.total ?? 0) - Number(expenses._sum.amount ?? 0),
        };
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[REVENUE_CHART]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

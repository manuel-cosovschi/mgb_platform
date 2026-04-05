import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "overview";
  const months = parseInt(searchParams.get("months") ?? "6");

  if (type === "revenue-by-client") {
    const start = startOfMonth(subMonths(new Date(), months));
    const data = await db.invoice.groupBy({
      by: ["clientId"],
      where: { status: "PAID", paidDate: { gte: start } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    });

    const enriched = await Promise.all(
      data.map(async (row) => {
        const client = await db.client.findUnique({
          where: { id: row.clientId },
          select: { name: true, company: true },
        });
        return {
          name: client?.company ?? client?.name ?? "Desconocido",
          total: Number(row._sum.total ?? 0),
        };
      })
    );
    return NextResponse.json(enriched);
  }

  if (type === "team-hours") {
    const start = startOfMonth(subMonths(new Date(), months));
    const data = await db.timeEntry.groupBy({
      by: ["userId"],
      where: { startTime: { gte: start }, endTime: { not: null } },
      _sum: { duration: true },
    });

    const enriched = await Promise.all(
      data.map(async (row) => {
        const user = await db.user.findUnique({ where: { id: row.userId }, select: { name: true } });
        return {
          name: user?.name?.split(" ")[0] ?? "?",
          horas: Math.round((Number(row._sum.duration ?? 0)) / 3600),
        };
      })
    );
    return NextResponse.json(enriched.sort((a, b) => b.horas - a.horas));
  }

  if (type === "project-profitability") {
    const projects = await db.project.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        invoices: { where: { status: "PAID" }, select: { total: true } },
        timeEntries: { select: { duration: true, hourlyRate: true } },
        client: { select: { name: true } },
      },
      take: 10,
    });

    const data = projects.map((p) => {
      const revenue = p.invoices.reduce((s, inv) => s + Number(inv.total), 0);
      const laborCost = p.timeEntries.reduce((s, te) => {
        const hours = (te.duration ?? 0) / 3600;
        const rate = Number(te.hourlyRate ?? 2000); // default rate
        return s + hours * rate;
      }, 0);
      return {
        name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
        ingresos: revenue,
        costos: Math.round(laborCost),
        ganancia: revenue - Math.round(laborCost),
      };
    });
    return NextResponse.json(data);
  }

  // Default: monthly summary last N months
  const monthsList = Array.from({ length: months }, (_, i) => subMonths(new Date(), months - 1 - i));
  const data = await Promise.all(
    monthsList.map(async (month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const [revenue, expenses, hours] = await Promise.all([
        db.invoice.aggregate({ where: { status: "PAID", paidDate: { gte: start, lte: end } }, _sum: { total: true } }),
        db.expense.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true } }),
        db.timeEntry.aggregate({ where: { startTime: { gte: start, lte: end }, endTime: { not: null } }, _sum: { duration: true } }),
      ]);
      return {
        month: format(month, "MMM yy"),
        ingresos: Number(revenue._sum.total ?? 0),
        egresos: Number(expenses._sum.amount ?? 0),
        horas: Math.round((Number(hours._sum.duration ?? 0)) / 3600),
        ganancia: Number(revenue._sum.total ?? 0) - Number(expenses._sum.amount ?? 0),
      };
    })
  );

  return NextResponse.json(data);
}

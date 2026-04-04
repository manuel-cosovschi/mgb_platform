import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      activeProjects,
      pendingTasks,
      currentMonthInvoices,
      lastMonthInvoices,
      overdueInvoices,
      currentMonthHours,
      newClients,
    ] = await Promise.all([
      db.project.count({ where: { status: "ACTIVE" } }),
      db.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] } } }),
      db.invoice.aggregate({
        where: { status: "PAID", paidDate: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
      }),
      db.invoice.aggregate({
        where: { status: "PAID", paidDate: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { total: true },
      }),
      db.invoice.count({ where: { status: "OVERDUE" } }),
      db.timeEntry.aggregate({
        where: { startTime: { gte: monthStart, lte: monthEnd }, endTime: { not: null } },
        _sum: { duration: true },
      }),
      db.client.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);

    const currentRevenue = Number(currentMonthInvoices._sum.total ?? 0);
    const lastRevenue = Number(lastMonthInvoices._sum.total ?? 0);
    const revenueGrowth =
      lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    const totalSeconds = currentMonthHours._sum.duration ?? 0;
    const hoursThisMonth = Math.round(totalSeconds / 3600);

    // Completion rate (tareas completadas este mes / total)
    const [completedThisMonth, totalThisMonth] = await Promise.all([
      db.task.count({ where: { status: "DONE", completedAt: { gte: monthStart, lte: monthEnd } } }),
      db.task.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);
    const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0;

    return NextResponse.json({
      monthlyRevenue: currentRevenue,
      activeProjects,
      pendingTasks,
      hoursThisMonth,
      overdueInvoices,
      newClients,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      completionRate,
    });
  } catch (error) {
    console.error("[DASHBOARD_KPIS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

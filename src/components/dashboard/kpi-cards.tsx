"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, FolderKanban, CheckSquare, Clock, AlertCircle, Users } from "lucide-react";
import { KpiCard } from "./kpi-card";
import type { DashboardKPIs } from "@/types";

export function KpiCards() {
  const { data, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/kpis");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Ingresos del mes"
        value={data?.monthlyRevenue ?? 0}
        format="currency"
        currency="ARS"
        trend={data?.revenueGrowth}
        trendLabel="vs mes anterior"
        icon={DollarSign}
        iconColor="text-emerald-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Proyectos activos"
        value={data?.activeProjects ?? 0}
        format="number"
        icon={FolderKanban}
        iconColor="text-blue-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Tareas pendientes"
        value={data?.pendingTasks ?? 0}
        format="number"
        icon={CheckSquare}
        iconColor="text-yellow-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Horas este mes"
        value={data?.hoursThisMonth ?? 0}
        format="number"
        subtitle="horas registradas"
        icon={Clock}
        iconColor="text-purple-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Facturas vencidas"
        value={data?.overdueInvoices ?? 0}
        format="number"
        icon={AlertCircle}
        iconColor="text-destructive"
        isLoading={isLoading}
      />
      <KpiCard
        title="Nuevos clientes"
        value={data?.newClients ?? 0}
        format="number"
        subtitle="este mes"
        icon={Users}
        iconColor="text-indigo-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Tasa de completado"
        value={data?.completionRate ?? 0}
        format="percent"
        subtitle="tareas este mes"
        icon={CheckSquare}
        iconColor="text-teal-500"
        isLoading={isLoading}
      />
    </div>
  );
}

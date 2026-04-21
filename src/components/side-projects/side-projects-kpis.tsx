"use client";

import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Lightbulb, Rocket, FlaskConical, CheckCircle, Archive, DollarSign, Zap } from "lucide-react";

export function SideProjectsKpis() {
  const { data, isLoading } = useQuery({
    queryKey: ["side-projects-stats"],
    queryFn: async () => {
      const res = await fetch("/api/side-projects/stats");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      <KpiCard
        title="Total ideas"
        value={data?.total ?? 0}
        format="number"
        icon={Lightbulb}
        iconColor="text-yellow-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="En validación"
        value={(data?.evaluating ?? 0) + (data?.validating ?? 0)}
        format="number"
        icon={FlaskConical}
        iconColor="text-purple-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="En desarrollo"
        value={data?.inDevelopment ?? 0}
        format="number"
        icon={Zap}
        iconColor="text-orange-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Lanzadas"
        value={data?.launched ?? 0}
        format="number"
        icon={Rocket}
        iconColor="text-emerald-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Archivadas"
        value={data?.archived ?? 0}
        format="number"
        icon={Archive}
        iconColor="text-gray-400"
        isLoading={isLoading}
      />
      <KpiCard
        title="ROI generado"
        value={data?.roiGenerated ?? 0}
        format="currency"
        currency="USD"
        icon={DollarSign}
        iconColor="text-green-500"
        isLoading={isLoading}
      />
      <KpiCard
        title="Priorizada ahora"
        value={data?.activeProject?.title ?? "—"}
        format="raw"
        icon={CheckCircle}
        iconColor="text-blue-500"
        isLoading={isLoading}
      />
    </div>
  );
}

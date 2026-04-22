"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Rocket, TrendingUp, Target, Users, BarChart3, Clock } from "lucide-react";

interface StatsData {
  total: number;
  byStatus: { status: string; _count: number }[];
  byType: { type: string; _count: number }[];
  avgScore: number;
  topVoted: { id: string; title: string; emoji: string; totalScore: number; _count: { votes: number } }[];
}

interface SideProjectsKpisProps {
  stats: StatsData | null;
  loading?: boolean;
}

export function SideProjectsKpis({ stats, loading }: SideProjectsKpisProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>
        ))}
      </div>
    );
  }

  const getStatusCount = (s: string) => stats.byStatus.find((b) => b.status === s)?._count ?? 0;
  const activeIdeas = getStatusCount("IDEA") + getStatusCount("EVALUATING");
  const inDev = getStatusCount("IN_DEVELOPMENT") + getStatusCount("MVP_READY");
  const launched = getStatusCount("LAUNCHED");

  const kpis = [
    { label: "Total ideas", value: stats.total, icon: Lightbulb, color: "#6366f1" },
    { label: "En evaluación", value: activeIdeas, icon: Target, color: "#3b82f6" },
    { label: "En desarrollo", value: inDev, icon: Clock, color: "#8b5cf6" },
    { label: "Lanzados", value: launched, icon: Rocket, color: "#22c55e" },
    { label: "Score promedio", value: stats.avgScore, icon: BarChart3, color: "#f59e0b" },
    { label: "Tipos únicos", value: stats.byType.length, icon: Users, color: "#ec4899" },
    { label: "Top votada", value: stats.topVoted[0]?._count.votes ?? 0, icon: TrendingUp, color: "#ef4444", subtitle: stats.topVoted[0]?.title },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
      {kpis.map(({ label, value, icon: Icon, color, subtitle }) => (
        <Card key={label} className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }} />
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{subtitle}</p>}
              </div>
              <div className="rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899"];

function ChartCard({ title, description, children, isLoading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : children}
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--popover-foreground))",
};
const axisStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

export default function AnalyticsPage() {
  const { data: monthly, isLoading: l1 } = useQuery({
    queryKey: ["analytics-monthly"],
    queryFn: async () => { const r = await fetch("/api/analytics?type=overview&months=6"); return r.json(); },
  });

  const { data: byClient, isLoading: l2 } = useQuery({
    queryKey: ["analytics-by-client"],
    queryFn: async () => { const r = await fetch("/api/analytics?type=revenue-by-client&months=6"); return r.json(); },
  });

  const { data: teamHours, isLoading: l3 } = useQuery({
    queryKey: ["analytics-team-hours"],
    queryFn: async () => { const r = await fetch("/api/analytics?type=team-hours&months=3"); return r.json(); },
  });

  const { data: profitability, isLoading: l4 } = useQuery({
    queryKey: ["analytics-profitability"],
    queryFn: async () => { const r = await fetch("/api/analytics?type=project-profitability"); return r.json(); },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Analytics" }]} />
      <div className="flex-1 p-6 space-y-6">

        {/* Row 1: revenue area + pie by client */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Ingresos vs Egresos"
            description="Últimos 6 meses"
            isLoading={l1}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#6366f1" strokeWidth={2} fill="url(#gi)" />
                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#f43f5e" strokeWidth={2} fill="url(#ge)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue por cliente" description="Últimos 6 meses" isLoading={l2}>
            {byClient?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byClient} cx="50%" cy="50%" outerRadius={80} dataKey="total" nameKey="name">
                    {(byClient as any[]).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground text-sm py-8">Sin datos</p>}
          </ChartCard>
        </div>

        {/* Row 2: Team hours + project profitability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Horas por persona" description="Últimos 3 meses" isLoading={l3}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamHours} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={axisStyle} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}h`, "Horas"]} />
                <Bar dataKey="horas" name="Horas" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Rentabilidad por proyecto" description="Ingresos vs costos de horas" isLoading={l4}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitability}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costos" name="Costos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Ganancia mensual bar */}
        <ChartCard title="Ganancia neta mensual" isLoading={l1}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), "Ganancia"]} />
              <Bar dataKey="ganancia" name="Ganancia neta" radius={[4, 4, 0, 0]}>
                {(monthly ?? []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.ganancia >= 0 ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

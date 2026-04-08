"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  DollarSign, Users, TrendingUp, Clock, CheckCircle2,
  Unlock, Plus, AlertTriangle, ChevronDown, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Socio colors
const SOCIO_COLORS = [
  { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950/30" },
  { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50 dark:bg-blue-950/30" },
  { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50 dark:bg-violet-950/30" },
  { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50 dark:bg-orange-950/30" },
];

const ACTION_LABELS: Record<string, string> = {
  INITIAL_ASSIGN: "Asignación inicial",
  RELEASED: "Liberó tarea",
  CLAIMED: "Reclamó tarea",
  AUTO_REDISTRIBUTED: "Redistribución automática",
  COMPLETED: "Completada",
};

interface Props {
  projectId: string;
  projectSlug: string;
  budgetCurrency: string;
  isSocio: boolean;
}

export function DistributionTab({ projectId, projectSlug, budgetCurrency, isSocio }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [setupBudget, setSetupBudget] = useState("");
  const [setupOpCost, setSetupOpCost] = useState("20");
  const [releasing, setReleasing] = useState<string[]>([]);
  const currency = budgetCurrency;

  const { data: poolData, isLoading } = useQuery({
    queryKey: ["pool", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: available = [] } = useQuery({
    queryKey: ["pool-available", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool/available`);
      return res.json();
    },
    enabled: !!poolData?.pool,
    refetchInterval: 15_000,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["pool-movements", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool/movements`);
      return res.json();
    },
    enabled: !!poolData?.pool,
  });

  const { data: myDists = [] } = useQuery({
    queryKey: ["pool-my", projectId, session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool`);
      if (!res.ok) return [];
      const d = await res.json();
      return (d?.pool?.distributions ?? []).filter((x: any) => x.assignedTo === session?.user?.id && x.status !== "RELEASED");
    },
    enabled: !!poolData?.pool && isSocio,
  });

  const setupPool = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: parseFloat(setupBudget), operatingCostPct: parseFloat(setupOpCost) / 100 }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast.success("Pool de distribución creado y tareas distribuidas");
      queryClient.invalidateQueries({ queryKey: ["pool", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-my", projectId] });
    },
    onError: (e: any) => toast.error("Error al crear pool: " + e.message),
  });

  const claimTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/projects/${projectId}/pool/claim/${taskId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Tarea reclamada — ${currency} ${data.value?.toFixed(2)} agregado a tu carga`);
      queryClient.invalidateQueries({ queryKey: ["pool", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-available", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-my", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-movements", projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const releaseTasks = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const res = await fetch(`/api/projects/${projectId}/pool/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.released} tarea(s) liberada(s) — ${currency} ${data.totalValue?.toFixed(2)} disponible para otros socios`);
      setReleasing([]);
      queryClient.invalidateQueries({ queryKey: ["pool", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-available", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-my", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-movements", projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando distribución...</div>;
  }

  const pool = poolData?.pool;
  const summary: any[] = poolData?.summary ?? [];

  if (!pool) {
    if (!isSocio) {
      return <div className="p-8 text-center text-muted-foreground">Sin pool de distribución configurado.</div>;
    }
    return (
      <div className="p-6 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-lg">Configurar distribución</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresá el presupuesto del proyecto para activar la distribución automática de tareas.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Presupuesto total ({currency})</Label>
              <Input type="number" placeholder="3000" value={setupBudget} onChange={e => setSetupBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>% Gastos operativos (default 20%)</Label>
              <Input type="number" placeholder="20" value={setupOpCost} onChange={e => setSetupOpCost(e.target.value)} />
              {setupBudget && (
                <p className="text-xs text-muted-foreground">
                  Pool distribuible: {currency} {(parseFloat(setupBudget || "0") * (1 - parseFloat(setupOpCost || "0") / 100)).toFixed(2)}
                </p>
              )}
            </div>
            <Button className="w-full" onClick={() => setupPool.mutate()} disabled={!setupBudget || setupPool.isPending}>
              {setupPool.isPending ? "Configurando..." : "Activar distribución →"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = summary.reduce((s, x) => s + x.value, 0);
  const userColors = Object.fromEntries(summary.filter(s => s.userId).map((s, i) => [s.userId, SOCIO_COLORS[i % SOCIO_COLORS.length]]));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Available tasks banner */}
      {available.length > 0 && isSocio && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {available.length} tarea(s) disponibles por {currency} {available.reduce((s: number, d: any) => s + d.monetaryValue, 0).toFixed(2)}
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-500 text-amber-700 text-xs" onClick={() => document.getElementById("available-tasks")?.scrollIntoView({ behavior: "smooth" })}>
            Ver tareas
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pool distribuible</p>
            <p className="text-2xl font-bold mt-1">{currency} {pool.distributablePool.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(pool.operatingCostPct * 100).toFixed(0)}% op. = {currency} {(pool.totalBudget * pool.operatingCostPct).toFixed(2)} al fondo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total de puntos</p>
            <p className="text-2xl font-bold mt-1">{pool.totalPoints} pts</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pool.distributions?.length ?? 0} tareas en el pool</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Sin asignar</p>
            <p className="text-2xl font-bold mt-1">{currency} {available.reduce((s: number, d: any) => s + d.monetaryValue, 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{available.length} tarea(s) liberadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Distribución por socio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Socio</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Tareas</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Puntos</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => {
                  const color = row.userId ? userColors[row.userId] : { bg: "bg-zinc-400", text: "text-zinc-500", light: "bg-zinc-50" };
                  const pct = totalValue > 0 ? (row.value / totalValue) * 100 : 0;
                  return (
                    <tr key={row.userId ?? "__none__"} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                          <span className="font-medium">{row.name}</span>
                          {row.userId === session?.user?.id && <Badge variant="outline" className="text-[10px] h-4">Vos</Badge>}
                        </div>
                        <div className="mt-1.5">
                          <Progress value={row.tasks > 0 ? (row.completed / row.tasks) * 100 : 0} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-0.5">{row.completed}/{row.tasks} completadas</p>
                        </div>
                      </td>
                      <td className="p-3 text-center">{row.tasks}</td>
                      <td className="p-3 text-center">{row.points}</td>
                      <td className="p-3 text-right font-medium">{currency} {row.value.toFixed(2)}</td>
                      <td className="p-3 text-right text-muted-foreground">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/30 font-medium">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-center">{summary.reduce((s, x) => s + x.tasks, 0)}</td>
                  <td className="p-3 text-center">{summary.reduce((s, x) => s + x.points, 0)}</td>
                  <td className="p-3 text-right">{currency} {totalValue.toFixed(2)}</td>
                  <td className="p-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* My tasks + release */}
      {isSocio && myDists.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mis tareas asignadas</CardTitle>
              {releasing.length > 0 && (
                <Button size="sm" variant="destructive" onClick={() => releaseTasks.mutate(releasing)} disabled={releaseTasks.isPending}>
                  <Unlock className="h-3.5 w-3.5 mr-1" /> Liberar {releasing.length} seleccionada(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {myDists.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={releasing.includes(d.taskId)}
                    onChange={e => setReleasing(prev => e.target.checked ? [...prev, d.taskId] : prev.filter(x => x !== d.taskId))}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.task?.title ?? "Tarea"}</p>
                    <p className="text-xs text-muted-foreground">{d.points} pts</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-600">{currency} {d.monetaryValue.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{(d.percentage * 100).toFixed(1)}% del pool</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available tasks */}
      {available.length > 0 && (
        <Card id="available-tasks">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Tareas disponibles para reclamar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {available.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.task?.title ?? "Tarea"}</p>
                    <p className="text-xs text-muted-foreground">{d.points} pts · {d.task?.priority}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-emerald-600">{currency} {d.monetaryValue.toFixed(2)}</span>
                    {isSocio && (
                      <Button size="sm" onClick={() => claimTask.mutate(d.taskId)} disabled={claimTask.isPending}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Reclamar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement history */}
      {movements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Historial de movimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-64 overflow-y-auto">
              {movements.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{ACTION_LABELS[m.action] ?? m.action}</span>
                    {" — "}
                    <span className="text-muted-foreground">{m.taskTitle}</span>
                    {m.fromUserName && <span className="text-muted-foreground"> de {m.fromUserName}</span>}
                    {m.toUserName && <span className="text-muted-foreground"> → {m.toUserName}</span>}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium">{currency} {m.value.toFixed(2)}</span>
                    <p className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("es-AR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

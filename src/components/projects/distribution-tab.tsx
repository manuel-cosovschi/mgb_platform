"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  DollarSign, Users, Unlock, Plus, AlertTriangle,
  Activity, ChevronRight, ChevronLeft, Wand2, CheckCircle2,
  Circle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SOCIO_COLORS = [
  { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950/30" },
  { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50 dark:bg-blue-950/30" },
  { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50 dark:bg-violet-950/30" },
  { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50 dark:bg-orange-950/30" },
];

const LOAD_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Carga baja", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  medium: { label: "Carga media", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  high: { label: "Carga alta", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
};

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
  const currency = budgetCurrency;

  // Setup form state
  const [budget, setBudget] = useState("");
  const [opCost, setOpCost] = useState("20");
  const [selectedSocios, setSelectedSocios] = useState<string[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<any>(null);
  const [releasing, setReleasing] = useState<string[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Queries
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ["pool", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pool`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${projectId}&limit=100`);
      if (!res.ok) return [];
      const d = await res.json();
      return d.data ?? [];
    },
  });

  const { data: workload = [] } = useQuery({
    queryKey: ["workload"],
    queryFn: async () => {
      const res = await fetch("/api/users/workload");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isSocio,
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

  // Initialize selected socios to all socios from workload on first load
  useEffect(() => {
    if (workload.length > 0 && selectedSocios.length === 0) {
      setSelectedSocios(workload.map((w: any) => w.userId));
    }
  }, [workload]);

  // Sync budget from project budget if available
  useEffect(() => {
    if (!budget && tasks.length > 0 && tasks[0]?.project?.budget) {
      setBudget(String(tasks[0].project.budget));
    }
  }, [tasks]);

  const createPool = useMutation({
    mutationFn: async (body: object) => {
      const res = await fetch(`/api/projects/${projectId}/pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast.success("Distribución activada");
      queryClient.invalidateQueries({ queryKey: ["pool", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
    onError: (e: any) => toast.error("Error: " + e.message),
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
      toast.success(`${data.released} tarea(s) liberada(s)`);
      setReleasing([]);
      queryClient.invalidateQueries({ queryKey: ["pool", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-available", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pool-movements", projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handlePreview() {
    if (!budget || !selectedSocios.length) {
      toast.error("Completá el presupuesto y seleccioná al menos un socio");
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: true,
          totalBudget: parseFloat(budget),
          operatingCostPct: parseFloat(opCost) / 100,
          participantIds: selectedSocios,
          storyPointsMap: pointsMap,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data);
    } catch (e: any) {
      toast.error("Error al previsualizar: " + e.message);
    } finally {
      setIsPreviewing(false);
    }
  }

  function handleConfirm() {
    createPool.mutate({
      totalBudget: parseFloat(budget),
      operatingCostPct: parseFloat(opCost) / 100,
      participantIds: selectedSocios,
      storyPointsMap: pointsMap,
    });
    setPreview(null);
  }

  if (poolLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando distribución...
      </div>
    );
  }

  const pool = poolData?.pool;

  // ─── ACTIVE POOL VIEW ────────────────────────────────────────────────────────
  if (pool) {
    const summary: any[] = poolData?.summary ?? [];
    const totalValue = summary.reduce((s: number, x: any) => s + x.value, 0);
    const userColors = Object.fromEntries(
      summary.filter((s: any) => s.userId).map((s: any, i: number) => [s.userId, SOCIO_COLORS[i % SOCIO_COLORS.length]])
    );
    const myDists = (pool.distributions ?? []).filter(
      (x: any) => x.assignedTo === session?.user?.id && x.status !== "RELEASED"
    );

    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Available tasks banner */}
        {available.length > 0 && isSocio && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {available.length} tarea(s) disponibles por {currency}{" "}
                {available.reduce((s: number, d: any) => s + d.monetaryValue, 0).toFixed(2)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-700 text-xs"
              onClick={() => document.getElementById("available-tasks")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver tareas
            </Button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Pool distribuible</p>
              <p className="text-2xl font-bold mt-1">
                {currency} {pool.distributablePool.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(pool.operatingCostPct * 100).toFixed(0)}% op. = {currency}{" "}
                {(pool.totalBudget * pool.operatingCostPct).toFixed(2)} al fondo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total de puntos</p>
              <p className="text-2xl font-bold mt-1">{pool.totalPoints} pts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pool.distributions?.length ?? 0} tareas en el pool
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Sin asignar</p>
              <p className="text-2xl font-bold mt-1">
                {currency} {available.reduce((s: number, d: any) => s + d.monetaryValue, 0).toFixed(2)}
              </p>
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
                  {summary.map((row: any) => {
                    const color = row.userId
                      ? userColors[row.userId]
                      : { bg: "bg-zinc-400", text: "text-zinc-500", light: "bg-zinc-50" };
                    const pct = totalValue > 0 ? (row.value / totalValue) * 100 : 0;
                    return (
                      <tr key={row.userId ?? "__none__"} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                            <span className="font-medium">{row.name}</span>
                            {row.userId === session?.user?.id && (
                              <Badge variant="outline" className="text-[10px] h-4">
                                Vos
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <Progress value={row.tasks > 0 ? (row.completed / row.tasks) * 100 : 0} className="h-1" />
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {row.completed}/{row.tasks} completadas
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-center">{row.tasks}</td>
                        <td className="p-3 text-center">{row.points}</td>
                        <td className="p-3 text-right font-medium">
                          {currency} {row.value.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/30 font-medium">
                    <td className="p-3">TOTAL</td>
                    <td className="p-3 text-center">{summary.reduce((s: number, x: any) => s + x.tasks, 0)}</td>
                    <td className="p-3 text-center">{summary.reduce((s: number, x: any) => s + x.points, 0)}</td>
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
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => releaseTasks.mutate(releasing)}
                    disabled={releaseTasks.isPending}
                  >
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
                      onChange={(e) =>
                        setReleasing((prev) =>
                          e.target.checked ? [...prev, d.taskId] : prev.filter((x) => x !== d.taskId)
                        )
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.task?.title ?? "Tarea"}</p>
                      <p className="text-xs text-muted-foreground">{d.points} pts</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">
                        {currency} {d.monetaryValue.toFixed(2)}
                      </p>
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
                      <span className="text-sm font-semibold text-emerald-600">
                        {currency} {d.monetaryValue.toFixed(2)}
                      </span>
                      {isSocio && (
                        <Button
                          size="sm"
                          onClick={() => claimTask.mutate(d.taskId)}
                          disabled={claimTask.isPending}
                        >
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
                      {m.fromUserName && (
                        <span className="text-muted-foreground"> de {m.fromUserName}</span>
                      )}
                      {m.toUserName && (
                        <span className="text-muted-foreground"> → {m.toUserName}</span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-medium">{currency} {m.value.toFixed(2)}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("es-AR")}
                      </p>
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

  // ─── NO POOL: SETUP WIZARD ────────────────────────────────────────────────────
  if (!isSocio) {
    return (
      <div className="p-8 text-center text-muted-foreground">Sin pool de distribución configurado.</div>
    );
  }

  const distributablePool =
    budget ? parseFloat(budget) * (1 - parseFloat(opCost || "0") / 100) : 0;
  const totalPoints = tasks.reduce(
    (s: number, t: any) => s + ((pointsMap[t.id] ?? t.storyPoints) || 1),
    0
  );

  // ─── PREVIEW STATE ────────────────────────────────────────────────────────────
  if (preview) {
    const colorMap = Object.fromEntries(
      (preview.summary ?? []).map((s: any, i: number) => [s.userId, SOCIO_COLORS[i % SOCIO_COLORS.length]])
    );

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Volver a editar
          </Button>
          <span className="text-muted-foreground text-sm">Previsualización de distribución</span>
        </div>

        {/* Summary per socio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Distribución propuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Socio</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Tareas</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Puntos</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">A cobrar</th>
                </tr>
              </thead>
              <tbody>
                {preview.summary.map((row: any) => {
                  const color = colorMap[row.userId] ?? SOCIO_COLORS[0];
                  return (
                    <tr key={row.userId} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{row.tasks}</td>
                      <td className="p-3 text-center">{row.points}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">
                        {currency} {row.value.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Task-level assignments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Asignación por tarea</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-72 overflow-y-auto">
              {preview.assignments.map((a: any) => {
                const color = colorMap[a.assignedTo] ?? SOCIO_COLORS[0];
                return (
                  <div key={a.taskId} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.taskTitle}</p>
                      <p className="text-xs text-muted-foreground">{a.points} pts</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`h-2 w-2 rounded-full ${color.bg}`} />
                      <span className="text-sm">{a.assignedName}</span>
                      <span className="text-xs text-muted-foreground">
                        {currency} {a.monetaryValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={() => setPreview(null)} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={createPool.isPending}
          >
            {createPool.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirmar distribución
          </Button>
        </div>
      </div>
    );
  }

  // ─── SETUP FORM ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="font-semibold text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Configurar distribución de trabajo
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Asigná los story points por tarea, configurá el presupuesto y seleccioná los socios participantes. El sistema distribuirá automáticamente por especialidad.
        </p>
      </div>

      {/* Budget + opCost */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Presupuesto total ({currency})</Label>
            <Input
              type="number"
              placeholder="3000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>% Gastos operativos</Label>
            <Input
              type="number"
              placeholder="20"
              value={opCost}
              onChange={(e) => setOpCost(e.target.value)}
            />
          </div>
          {budget && (
            <div className="col-span-2 rounded-lg bg-muted px-4 py-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Pool distribuible:</span>
              <span className="font-semibold">
                {currency} {distributablePool.toFixed(2)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Socios selector */}
      {workload.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Socios participantes</span>
              <span className="text-xs font-normal text-muted-foreground">
                {selectedSocios.length}/{workload.length} seleccionados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workload.map((w: any) => {
              const load = LOAD_BADGE[w.loadLevel] ?? LOAD_BADGE.low;
              const checked = selectedSocios.includes(w.userId);
              return (
                <button
                  key={w.userId}
                  type="button"
                  onClick={() =>
                    setSelectedSocios((prev) =>
                      checked ? prev.filter((id) => id !== w.userId) : [...prev, w.userId]
                    )
                  }
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.activeProjects} proyectos activos · {w.totalAssignedPoints} pts asignados
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${load.className}`}>
                    {load.label}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Tasks table with editable story points */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Tareas del proyecto</span>
            <span className="text-xs font-normal text-muted-foreground">
              {tasks.length} tareas · {totalPoints} pts en total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay tareas creadas. Agregá tareas en el tablero primero.
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((t: any) => {
                const pts = pointsMap[t.id] ?? t.storyPoints ?? 1;
                const taskValue = totalPoints > 0 && budget
                  ? (distributablePool * pts) / totalPoints
                  : 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t.status?.toLowerCase().replace("_", " ")} · {t.priority?.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {budget && (
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          ≈ {currency} {taskValue.toFixed(2)}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="h-6 w-6 rounded border text-xs font-bold hover:bg-muted"
                          onClick={() =>
                            setPointsMap((prev) => ({ ...prev, [t.id]: Math.max(1, pts - 1) }))
                          }
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{pts}</span>
                        <button
                          type="button"
                          className="h-6 w-6 rounded border text-xs font-bold hover:bg-muted"
                          onClick={() =>
                            setPointsMap((prev) => ({ ...prev, [t.id]: pts + 1 }))
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full gap-2"
        size="lg"
        onClick={handlePreview}
        disabled={isPreviewing || tasks.length === 0 || !budget || !selectedSocios.length}
      >
        {isPreviewing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        {isPreviewing ? "Calculando..." : "Previsualizar distribución automática →"}
      </Button>
    </div>
  );
}

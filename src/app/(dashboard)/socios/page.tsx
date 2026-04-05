"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatRelativeTime, initials } from "@/lib/utils";
import { Plus, BookOpen, DollarSign, TrendingUp, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b"];

export default function SociosPage() {
  const [addDecision, setAddDecision] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ title: "", description: "", outcome: "" });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => { const r = await fetch("/api/partners"); return r.json(); },
  });

  const { data: decisions = [], refetch: refetchDecisions } = useQuery({
    queryKey: ["decisions"],
    queryFn: async () => { const r = await fetch("/api/partners/decisions"); return r.json(); },
  });

  async function submitDecision() {
    const res = await fetch("/api/partners/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decisionForm),
    });
    if (res.ok) {
      toast.success("Decisión registrada");
      setAddDecision(false);
      setDecisionForm({ title: "", description: "", outcome: "" });
      refetchDecisions();
    }
  }

  const equityData = partners.map((p: any, i: number) => ({
    name: p.user.name.split(" ")[0],
    value: Number(p.equityPercentage),
    color: COLORS[i % COLORS.length],
  }));

  const totalCapital = partners.reduce((sum: number, p: any) =>
    sum + p.capitalContributions.reduce((s: number, c: any) => s + Number(c.amount), 0), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Socios" }]} />
      <div className="flex-1 p-4 sm:p-6 space-y-6">

        {/* Partner cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
            : partners.map((p: any, i: number) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={p.user.image} />
                        <AvatarFallback className="text-sm">{initials(p.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{p.user.name}</p>
                        <p className="text-xs text-muted-foreground">{p.title}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equity</span>
                        <span className="font-bold text-lg" style={{ color: COLORS[i % COLORS.length] }}>
                          {Number(p.equityPercentage).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aportes</span>
                        <span className="font-medium">
                          {formatCurrency(
                            p.capitalContributions.reduce((s: number, c: any) => s + Number(c.amount), 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retiros</span>
                        <span className="font-medium">
                          {formatCurrency(
                            p.profitDistributions.reduce((s: number, d: any) => s + Number(d.amount), 0)
                          )}
                        </span>
                      </div>
                    </div>

                    {p.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {p.specialties.slice(0, 3).map((s: string) => (
                          <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{s}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equity chart */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Distribución de equity</CardTitle></CardHeader>
            <CardContent>
              {equityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={equityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {equityData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-48 w-full" />}
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capital total aportado</span>
                <span className="font-semibold">{formatCurrency(totalCapital)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Decisions log */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Bitácora de decisiones</CardTitle>
              <Button size="sm" onClick={() => setAddDecision(true)}>
                <Plus className="h-4 w-4 mr-1" /> Registrar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(decisions as any[]).map((d: any) => (
                  <div key={d.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{d.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(d.decisionDate)}</span>
                    </div>
                    {d.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
                    {d.outcome && (
                      <div className="mt-2 rounded bg-emerald-500/10 text-emerald-500 px-2 py-1 text-xs">
                        ✓ {d.outcome}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Por: {d.maker?.user?.name}</p>
                  </div>
                ))}
                {!(decisions as any[]).length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin decisiones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Decision Dialog */}
        <Dialog open={addDecision} onOpenChange={setAddDecision}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar decisión</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={decisionForm.title} onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })} placeholder="Ej: Contratación de nuevo desarrollador" />
              </div>
              <div className="space-y-1.5">
                <Label>Contexto / Descripción</Label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" value={decisionForm.description} onChange={(e) => setDecisionForm({ ...decisionForm, description: e.target.value })} placeholder="Contexto de la decisión..." />
              </div>
              <div className="space-y-1.5">
                <Label>Resultado / Acuerdo</Label>
                <Input value={decisionForm.outcome} onChange={(e) => setDecisionForm({ ...decisionForm, outcome: e.target.value })} placeholder="Decisión tomada..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDecision(false)}>Cancelar</Button>
              <Button onClick={submitDecision} disabled={!decisionForm.title}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

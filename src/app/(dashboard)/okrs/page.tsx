"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "success", DRAFT: "secondary", COMPLETED: "success", CANCELLED: "destructive",
};
const statusLabels: Record<string, string> = {
  ACTIVE: "Activo", DRAFT: "Borrador", COMPLETED: "Completado", CANCELLED: "Cancelado",
};

export default function OKRsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", frequency: "QUARTERLY", period: "2024-Q2",
    startDate: "2024-04-01", endDate: "2024-06-30",
    keyResults: [{ title: "", targetValue: "", unit: "" }],
  });
  const [checkinForm, setCheckinForm] = useState({ progress: "", notes: "", blockers: "" });

  const { data: okrs = [], isLoading, refetch } = useQuery({
    queryKey: ["okrs"],
    queryFn: async () => {
      const res = await fetch("/api/okrs");
      return res.json();
    },
  });

  function addKR() {
    setForm({ ...form, keyResults: [...form.keyResults, { title: "", targetValue: "", unit: "" }] });
  }

  async function createOKR() {
    const res = await fetch("/api/okrs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        keyResults: form.keyResults.filter((kr) => kr.title).map((kr) => ({
          ...kr,
          targetValue: Number(kr.targetValue) || 100,
        })),
      }),
    });
    if (res.ok) {
      toast.success("OKR creado");
      setCreateOpen(false);
      refetch();
    }
  }

  async function submitCheckin(okrId: string) {
    const res = await fetch(`/api/okrs/${okrId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkin", ...checkinForm, progress: Number(checkinForm.progress) }),
    });
    if (res.ok) {
      toast.success("Check-in registrado");
      setCheckinOpen(null);
      setCheckinForm({ progress: "", notes: "", blockers: "" });
      refetch();
    }
  }

  async function updateKR(okrId: string, kr: any, newValue: number) {
    await fetch(`/api/okrs/${okrId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: kr.id, currentValue: newValue, targetValue: Number(kr.targetValue) }),
    });
    refetch();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "OKRs" }]} />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Objetivos y resultados clave del equipo</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo OKR
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : !okrs.length ? (
          <div className="py-16 text-center text-muted-foreground">
            <Target className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Sin OKRs definidos</p>
            <p className="text-sm mt-1">Creá los objetivos del equipo para comenzar.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Crear primer OKR
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(okrs as any[]).map((okr: any) => (
              <Card key={okr.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{okr.title}</h3>
                          <Badge variant={(statusColors[okr.status] ?? "secondary") as any}>
                            {statusLabels[okr.status] ?? okr.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">{okr.period}</span>
                        </div>
                        {okr.description && <p className="text-sm text-muted-foreground mt-0.5">{okr.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={okr.owner?.image} />
                            <AvatarFallback className="text-[9px]">{initials(okr.owner?.name ?? "?")}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{okr.owner?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{Math.round(Number(okr.progress))}%</p>
                        <p className="text-xs text-muted-foreground">progreso</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setCheckinOpen(okr.id)}>
                        Check-in
                      </Button>
                    </div>
                  </div>
                  <Progress value={Number(okr.progress)} className="h-2 mt-3" />
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {okr.keyResults?.map((kr: any) => (
                      <div key={kr.id} className="flex items-center gap-3">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${Number(kr.progress) >= 100 ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm truncate">{kr.title}</p>
                            <span className="text-xs font-medium shrink-0">
                              {Number(kr.currentValue)}{kr.unit ? ` ${kr.unit}` : ""} / {Number(kr.targetValue)}{kr.unit ? ` ${kr.unit}` : ""}
                            </span>
                          </div>
                          <Progress value={Number(kr.progress)} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(Number(kr.progress))}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create OKR dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo OKR</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Objetivo *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Consolidar MGB como referente en B2B" />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Período</Label>
                  <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2024-Q2" />
                </div>
                <div className="space-y-1.5">
                  <Label>Inicio</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Key Results</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addKR}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                </div>
                <div className="space-y-2">
                  {form.keyResults.map((kr, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2">
                      <Input className="col-span-3" placeholder="Descripción del KR..." value={kr.title} onChange={(e) => {
                        const krs = [...form.keyResults];
                        krs[i] = { ...krs[i], title: e.target.value };
                        setForm({ ...form, keyResults: krs });
                      }} />
                      <Input type="number" placeholder="Meta" value={kr.targetValue} onChange={(e) => {
                        const krs = [...form.keyResults];
                        krs[i] = { ...krs[i], targetValue: e.target.value };
                        setForm({ ...form, keyResults: krs });
                      }} />
                      <Input placeholder="Unidad" value={kr.unit} onChange={(e) => {
                        const krs = [...form.keyResults];
                        krs[i] = { ...krs[i], unit: e.target.value };
                        setForm({ ...form, keyResults: krs });
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={createOKR} disabled={!form.title}>Crear OKR</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check-in dialog */}
        <Dialog open={!!checkinOpen} onOpenChange={(o) => !o && setCheckinOpen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Check-in de progreso</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Progreso general (0-100)</Label>
                <Input type="number" min="0" max="100" value={checkinForm.progress} onChange={(e) => setCheckinForm({ ...checkinForm, progress: e.target.value })} placeholder="70" />
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px] resize-none" value={checkinForm.notes} onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })} placeholder="¿Qué logramos esta semana?" />
              </div>
              <div className="space-y-1.5">
                <Label>Blockers</Label>
                <Input value={checkinForm.blockers} onChange={(e) => setCheckinForm({ ...checkinForm, blockers: e.target.value })} placeholder="¿Qué nos está bloqueando?" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckinOpen(null)}>Cancelar</Button>
              <Button onClick={() => checkinOpen && submitCheckin(checkinOpen)} disabled={!checkinForm.progress}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

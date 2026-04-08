"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LOAD_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Carga baja", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  medium: { label: "Carga media", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  high: { label: "Carga alta", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
};

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  budgetCurrency: z.enum(["ARS", "USD", "EUR"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSocios, setSelectedSocios] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: workload = [], isLoading: workloadLoading } = useQuery({
    queryKey: ["workload"],
    queryFn: async () => {
      const res = await fetch("/api/users/workload");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  // On first workload load, pre-select all socios
  const [sociosInitialized, setSociosInitialized] = useState(false);
  if (workload.length > 0 && !sociosInitialized) {
    setSelectedSocios(workload.map((w: any) => w.userId));
    setSociosInitialized(true);
  }

  async function goToStep2() {
    const valid = await trigger(["name"]);
    if (valid) setStep(2);
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, participantIds: selectedSocios }),
    });

    if (!res.ok) {
      toast.error("Error al crear el proyecto");
      return;
    }

    toast.success("Proyecto creado");
    reset();
    setStep(1);
    setSelectedSocios([]);
    setSociosInitialized(false);
    onSuccess();
  }

  function handleClose(open: boolean) {
    if (!open) {
      reset();
      setStep(1);
      setSelectedSocios([]);
      setSociosInitialized(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Nuevo proyecto
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Paso {step} de 2
            </span>
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-1">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Step 1: Project details ────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre del proyecto *</Label>
                  <Input placeholder="Ej: App ecommerce para Acme" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label>Descripción</Label>
                  <Input placeholder="Descripción breve del proyecto..." {...register("description")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("status")}
                    defaultValue="PLANNING"
                  >
                    <option value="PLANNING">Planificación</option>
                    <option value="ACTIVE">Activo</option>
                    <option value="ON_HOLD">En pausa</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Prioridad</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("priority")}
                    defaultValue="MEDIUM"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Fecha inicio</Label>
                  <Input type="date" {...register("startDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Fecha fin</Label>
                  <Input type="date" {...register("endDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Presupuesto</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    {...register("budget", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("budgetCurrency")}
                    defaultValue="ARS"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={goToStep2}>
                  Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Step 2: Socio selection ────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm font-medium">Socios participantes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seleccioná quiénes van a trabajar en este proyecto. Podés cambiar esto más adelante.
                </p>
              </div>

              {workloadLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando socios...
                </div>
              ) : (
                <div className="space-y-2">
                  {workload.map((w: any) => {
                    const load = LOAD_BADGE[w.loadLevel] ?? LOAD_BADGE.low;
                    const checked = selectedSocios.includes(w.userId);
                    return (
                      <button
                        key={w.userId}
                        type="button"
                        onClick={() =>
                          setSelectedSocios((prev) =>
                            checked
                              ? prev.filter((id) => id !== w.userId)
                              : [...prev, w.userId]
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
                        <div className="flex-1 min-w-0 text-left">
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
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit" disabled={isSubmitting || selectedSocios.length === 0}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear proyecto
                </Button>
              </DialogFooter>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

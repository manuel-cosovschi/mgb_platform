"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  status: z.enum(["PLANNING","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  budgetCurrency: z.enum(["ARS","USD","EUR"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error("Error al crear el proyecto");
      return;
    }

    toast.success("Proyecto creado");
    reset();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre del proyecto *</Label>
              <Input placeholder="Ej: App ecommerce para Acme" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
              <Input type="number" placeholder="0" {...register("budget")} />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

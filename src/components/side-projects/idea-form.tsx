"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScoreBadge } from "./score-badge";

const schema = z.object({
  title: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  audience: z.string().optional(),
  type: z.enum(["SAAS", "MARKETPLACE", "TOOL", "AI", "ECOMMERCE", "APP", "OTHER"]),
  monetization: z.string().optional(),
  complexity: z.number().min(1).max(10),
  revenuePotential: z.number().min(1).max(10),
  timeEstimate: z.string().optional(),
  investment: z.string().optional(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  synergy: z.number().min(1).max(10),
  stackSuggested: z.string().optional(),
  observations: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface IdeaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: Partial<FormValues> & { id?: string };
}

export function IdeaForm({ open, onClose, onSuccess, defaultValues }: IdeaFormProps) {
  const isEditing = !!defaultValues?.id;
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      problem: defaultValues?.problem ?? "",
      solution: defaultValues?.solution ?? "",
      audience: defaultValues?.audience ?? "",
      type: defaultValues?.type ?? "SAAS",
      monetization: defaultValues?.monetization ?? "",
      complexity: defaultValues?.complexity ?? 5,
      revenuePotential: defaultValues?.revenuePotential ?? 5,
      timeEstimate: defaultValues?.timeEstimate ?? "",
      investment: defaultValues?.investment ?? "",
      risk: defaultValues?.risk ?? "MEDIUM",
      synergy: defaultValues?.synergy ?? 5,
      stackSuggested: defaultValues?.stackSuggested ?? "",
      observations: defaultValues?.observations ?? "",
    },
  });

  const watched = form.watch();

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const url = isEditing ? `/api/side-projects/${defaultValues!.id}` : "/api/side-projects";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error();

      toast.success(isEditing ? "Idea actualizada" : "Idea creada exitosamente");
      onSuccess();
      onClose();
    } catch {
      toast.error("Error al guardar la idea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar idea" : "Nueva idea de side project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: SaaS para barberías" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción breve de la idea..." rows={2} {...form.register("description")} />
            </div>

            <div className="space-y-1">
              <Label>Problema que resuelve</Label>
              <Textarea placeholder="¿Qué dolor soluciona?" rows={2} {...form.register("problem")} />
            </div>

            <div className="space-y-1">
              <Label>Solución propuesta</Label>
              <Textarea placeholder="¿Cómo lo resuelve?" rows={2} {...form.register("solution")} />
            </div>

            <div className="space-y-1">
              <Label>Público objetivo</Label>
              <Input placeholder="Ej: PYMEs del sector gastronómico" {...form.register("audience")} />
            </div>

            <div className="space-y-1">
              <Label>Tipo de proyecto</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["SAAS","☁️ SaaS"],["MARKETPLACE","🛒 Marketplace"],["TOOL","🔧 Tool"],["AI","🤖 IA"],["ECOMMERCE","🏪 E-commerce"],["APP","📱 App"],["OTHER","📦 Otro"]].map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Monetización</Label>
              <Input placeholder="Ej: Suscripción mensual, comisión por transacción" {...form.register("monetization")} />
            </div>

            <div className="space-y-1">
              <Label>Stack sugerido</Label>
              <Input placeholder="Ej: Next.js, Prisma, Stripe" {...form.register("stackSuggested")} />
            </div>

            <div className="space-y-1">
              <Label>Tiempo estimado</Label>
              <Input placeholder="Ej: 1 mes, 2-3 meses" {...form.register("timeEstimate")} />
            </div>

            <div className="space-y-1">
              <Label>Inversión inicial</Label>
              <Input placeholder="Ej: USD 500, sin inversión" {...form.register("investment")} />
            </div>

            <div className="space-y-1">
              <Label>Riesgo</Label>
              <Select value={form.watch("risk")} onValueChange={(v) => form.setValue("risk", v as FormValues["risk"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Bajo</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medio</SelectItem>
                  <SelectItem value="HIGH">🔴 Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Potencial ingresos (1-10)</Label>
                <Input
                  type="number" min={1} max={10}
                  {...form.register("revenuePotential", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label>Complejidad (1-10)</Label>
                <Input
                  type="number" min={1} max={10}
                  {...form.register("complexity", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label>Sinergia agencia (1-10)</Label>
                <Input
                  type="number" min={1} max={10}
                  {...form.register("synergy", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="col-span-2 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-2">Score calculado en tiempo real:</p>
              <ScoreBadge
                input={{ revenuePotential: watched.revenuePotential, complexity: watched.complexity, synergy: watched.synergy, risk: watched.risk, timeEstimate: watched.timeEstimate }}
                showBreakdown
                size="md"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Observaciones</Label>
              <Textarea placeholder="Notas adicionales..." rows={2} {...form.register("observations")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

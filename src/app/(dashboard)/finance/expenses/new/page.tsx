"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const categories = [
  { value: "HOSTING", label: "Hosting / Infraestructura" },
  { value: "TOOLS", label: "Herramientas / Software" },
  { value: "SALARIES", label: "Sueldos" },
  { value: "TAXES", label: "Impuestos" },
  { value: "OFFICE", label: "Oficina / Coworking" },
  { value: "MARKETING", label: "Marketing / Publicidad" },
  { value: "TRAVEL", label: "Viajes" },
  { value: "OTHER", label: "Otros" },
];

const schema = z.object({
  category: z.enum(["HOSTING","TOOLS","SALARIES","TAXES","OFFICE","MARKETING","TRAVEL","OTHER"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["ARS","USD","EUR"]),
  date: z.string().min(1),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewExpensePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "ARS", date: new Date().toISOString().split("T")[0] },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) { toast.error("Error al guardar gasto"); return; }
    toast.success("Gasto registrado");
    router.push("/finance");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Finanzas", href: "/finance" }, { label: "Nuevo gasto" }]} />
      <div className="flex-1 p-4 sm:p-6 max-w-lg">
        <Card>
          <CardHeader><CardTitle>Registrar gasto</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("category")}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Descripción *</Label>
                <Input placeholder="Ej: Vercel Pro Plan - Marzo" {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Monto *</Label>
                  <Input type="number" step="0.01" placeholder="0.00" {...register("amount", { valueAsNumber: true })} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("currency")}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input type="date" {...register("date")} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurring" className="h-4 w-4 accent-primary" {...register("isRecurring")} />
                <Label htmlFor="recurring" className="cursor-pointer">Gasto recurrente</Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar gasto
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/finance")}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

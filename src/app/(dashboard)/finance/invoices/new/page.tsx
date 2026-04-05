"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  clientId: z.string().min(1, "Seleccioná un cliente"),
  projectId: z.string().optional(),
  currency: z.enum(["ARS","USD","EUR"]),
  taxRate: z.number().min(0).max(100),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

type FormData = z.infer<typeof schema>;

export default function NewInvoicePage() {
  const router = useRouter();

  const { data: clientsData } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => {
      const res = await fetch("/api/clients?limit=100");
      return res.json();
    },
  });
  const clients = clientsData?.data ?? [];

  const { data: projectsData } = useQuery({
    queryKey: ["projects-select"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=100");
      return res.json();
    },
  });
  const projects = projectsData?.data ?? [];

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "ARS",
      taxRate: 21,
      issueDate: today,
      dueDate: in30,
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");
  const watchTaxRate = watch("taxRate");
  const watchCurrency = watch("currency");

  const subtotal = (watchItems ?? []).reduce((s, item) => s + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxAmount = (subtotal * (Number(watchTaxRate) || 0)) / 100;
  const total = subtotal + taxAmount;

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Error al crear la factura");
      return;
    }

    toast.success("Factura creada");
    router.push("/finance");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Finanzas", href: "/finance" }, { label: "Nueva factura" }]} />
      <div className="flex-1 p-4 sm:p-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Cliente *</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("clientId")}>
                        <option value="">Seleccionar cliente...</option>
                        {clients.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                        ))}
                      </select>
                      {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Proyecto</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("projectId")}>
                        <option value="">Sin proyecto</option>
                        {projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Moneda</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("currency")}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fecha emisión</Label>
                      <Input type="date" {...register("issueDate")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fecha vencimiento</Label>
                      <Input type="date" {...register("dueDate")} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Ítems</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar ítem
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                      <div className="col-span-6">Descripción</div>
                      <div className="col-span-2 text-right">Cantidad</div>
                      <div className="col-span-3 text-right">Precio unit.</div>
                      <div className="col-span-1"></div>
                    </div>
                    {fields.map((field, i) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <Input placeholder="Descripción del servicio..." {...register(`items.${i}.description`)} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" step="0.01" min="0" {...register(`items.${i}.quantity`, { valueAsNumber: true })} className="text-right" />
                        </div>
                        <div className="col-span-3">
                          <Input type="number" step="0.01" min="0" placeholder="0.00" {...register(`items.${i}.unitPrice`, { valueAsNumber: true })} className="text-right" />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label>Notas (opcional)</Label>
                  <textarea
                    className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                    placeholder="Condiciones, términos, agradecimientos..."
                    {...register("notes")}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary sidebar */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal, watchCurrency as any)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-muted-foreground">IVA</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        className="w-16 h-7 text-xs text-right"
                        {...register("taxRate", { valueAsNumber: true })}
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto</span>
                    <span>{formatCurrency(taxAmount, watchCurrency as any)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total, watchCurrency as any)}</span>
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear factura
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/finance")}>
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

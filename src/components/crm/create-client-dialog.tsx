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
  company: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  stage: z.enum(["LEAD","CONTACTED","PROPOSAL_SENT","NEGOTIATION","WON","LOST"]).optional(),
  score: z.enum(["LOW","MEDIUM","HIGH"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Error al crear el cliente");
      return;
    }

    toast.success("Cliente creado");
    reset();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Juan Pérez" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input placeholder="Acme Corp" {...register("company")} />
            </div>

            <div className="space-y-1.5">
              <Label>CUIT</Label>
              <Input placeholder="20-12345678-9" {...register("taxId")} />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="juan@empresa.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="+54 11 1234-5678" {...register("phone")} />
            </div>

            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input placeholder="Buenos Aires" {...register("city")} />
            </div>

            <div className="space-y-1.5">
              <Label>Industria</Label>
              <Input placeholder="Tecnología" {...register("industry")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

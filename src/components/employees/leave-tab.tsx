"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const statusVariant: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", REJECTED: "destructive", CANCELLED: "secondary",
};
const statusLabels: Record<string, string> = {
  PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", CANCELLED: "Cancelada",
};
const typeLabels: Record<string, string> = {
  VACATION: "Vacaciones", SICK: "Enfermedad", PERSONAL: "Personal",
  MATERNITY: "Maternidad", PATERNITY: "Paternidad", OTHER: "Otro",
};

interface Props {
  employeeId: string;
  leaveRequests: any[];
}

export function EmployeeLeaveTab({ employeeId, leaveRequests: initial }: Props) {
  const [requests, setRequests] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "VACATION", startDate: "", endDate: "", reason: "" });

  async function submit() {
    const res = await fetch(`/api/employees/${employeeId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests([data, ...requests]);
      setOpen(false);
      setForm({ type: "VACATION", startDate: "", endDate: "", reason: "" });
      toast.success("Solicitud enviada");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Licencias y vacaciones</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Solicitar
        </Button>
      </CardHeader>
      <CardContent>
        {!requests.length ? (
          <p className="text-muted-foreground text-sm">Sin solicitudes</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{typeLabels[r.type] ?? r.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days} día(s)
                  </p>
                  {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                </div>
                <Badge variant={(statusVariant[r.status] ?? "secondary") as any}>
                  {statusLabels[r.status] ?? r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Solicitar licencia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Desde</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hasta</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Input placeholder="Motivo..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.startDate || !form.endDate}>Enviar solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

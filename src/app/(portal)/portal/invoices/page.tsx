"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", PAID: "Pagada", OVERDUE: "Vencida",
  CANCELLED: "Cancelada", DRAFT: "Borrador",
};
const STATUS_VARIANTS: Record<string, string> = {
  PENDING: "warning", PAID: "success", OVERDUE: "destructive",
  CANCELLED: "secondary", DRAFT: "default",
};

export default function PortalInvoicesPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["portal-invoices"],
    queryFn: async () => {
      const r = await fetch("/api/portal/invoices");
      return r.json();
    },
  });

  const totalPending = invoices
    .filter((i: any) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum: number, i: any) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis facturas</h1>
        <p className="text-muted-foreground mt-1">Historial de facturación</p>
      </div>

      {totalPending > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-sm">Total pendiente de pago</p>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter((i: any) => i.status === "PENDING" || i.status === "OVERDUE").length} facturas
                </p>
              </div>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Sin facturas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">
                        Emitida: {formatDate(inv.issuedAt)}
                        {inv.dueDate && ` · Vence: ${formatDate(inv.dueDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{formatCurrency(inv.total)}</p>
                      {inv.paidDate && (
                        <p className="text-xs text-muted-foreground">Pagada: {formatDate(inv.paidDate)}</p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANTS[inv.status] as any}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </Badge>
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

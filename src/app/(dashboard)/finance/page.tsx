"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const invoiceStatusConfig: Record<string, { label: string; variant: string }> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  SENT: { label: "Enviada", variant: "info" },
  PAID: { label: "Pagada", variant: "success" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export default function FinancePage() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices?limit=20");
      return res.json();
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const res = await fetch("/api/finance/summary");
      if (!res.ok) return null;
      return res.json();
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Finanzas" }]} />
      <div className="flex-1 p-4 sm:p-6 space-y-6">

        {/* KPIs financieros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Ingresos del mes",
              value: summary?.monthlyRevenue ?? 0,
              icon: DollarSign,
              color: "text-emerald-500",
              format: "currency",
            },
            {
              title: "Egresos del mes",
              value: summary?.monthlyExpenses ?? 0,
              icon: TrendingDown,
              color: "text-red-500",
              format: "currency",
            },
            {
              title: "Ganancia neta",
              value: summary?.netProfit ?? 0,
              icon: TrendingUp,
              color: "text-blue-500",
              format: "currency",
            },
            {
              title: "Por cobrar",
              value: summary?.pendingInvoices ?? 0,
              icon: AlertCircle,
              color: "text-yellow-500",
              format: "currency",
            },
          ].map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(kpi.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Facturas / Gastos */}
        <Tabs defaultValue="invoices">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/finance/expenses/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Gasto
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/finance/invoices/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Factura
                </Link>
              </Button>
            </div>
          </div>

          <TabsContent value="invoices">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 font-medium text-muted-foreground">Número</th>
                      <th className="p-4 font-medium text-muted-foreground">Cliente</th>
                      <th className="p-4 font-medium text-muted-foreground">Proyecto</th>
                      <th className="p-4 font-medium text-muted-foreground">Estado</th>
                      <th className="p-4 font-medium text-muted-foreground">Emisión</th>
                      <th className="p-4 font-medium text-muted-foreground">Vencimiento</th>
                      <th className="p-4 font-medium text-muted-foreground text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b">
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="p-4">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : !invoices?.data?.length ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Sin facturas. Creá tu primera factura.
                        </td>
                      </tr>
                    ) : (
                      invoices.data.map((invoice: any) => {
                        const config = invoiceStatusConfig[invoice.status] ?? invoiceStatusConfig.DRAFT;
                        return (
                          <tr
                            key={invoice.id}
                            className="border-b hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => window.location.href = `/finance/invoices/${invoice.id}`}
                          >
                            <td className="p-4 font-mono text-xs font-medium">{invoice.number}</td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{invoice.client?.name}</p>
                                {invoice.client?.company && (
                                  <p className="text-xs text-muted-foreground">{invoice.client.company}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {invoice.project?.name ?? "—"}
                            </td>
                            <td className="p-4">
                              <Badge variant={config.variant as any}>{config.label}</Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">{formatDate(invoice.issueDate)}</td>
                            <td className="p-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                            <td className="p-4 text-right font-semibold">
                              {formatCurrency(invoice.total, invoice.currency)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <DollarSign className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p>Módulo de gastos — próximamente</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

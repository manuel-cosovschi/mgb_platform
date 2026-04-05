"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FolderOpen, FileText, CheckSquare, Clock, ArrowRight, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completado",
  ON_HOLD: "En pausa",
  PLANNING: "Planificación",
};

const STATUS_VARIANTS: Record<string, string> = {
  ACTIVE: "success",
  IN_REVIEW: "warning",
  COMPLETED: "secondary",
  ON_HOLD: "default",
  PLANNING: "info",
};

const INVOICE_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
  DRAFT: "Borrador",
};

const INVOICE_VARIANTS: Record<string, string> = {
  PENDING: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
  DRAFT: "default",
};

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-summary"],
    queryFn: async () => {
      const r = await fetch("/api/portal/summary");
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const { client, activeProjects = [], pendingInvoices = [], openTasks = 0, recentActivity = [] } = data || {};

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido/a, {client?.name?.split(" ")[0] || "Cliente"} 👋
        </h1>
        {client?.company && (
          <p className="text-muted-foreground mt-1">{client.company}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Proyectos activos"
          value={activeProjects.length}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={CheckSquare}
          label="Tareas abiertas"
          value={openTasks}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={FileText}
          label="Facturas pendientes"
          value={pendingInvoices.length}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Facturas vencidas"
          value={pendingInvoices.filter((i: any) => i.status === "OVERDUE").length}
          color="bg-red-500/10 text-red-500"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Proyectos en curso</CardTitle>
            <Link href="/portal/projects">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay proyectos activos
              </p>
            ) : (
              activeProjects.map((p: any) => (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/portal/projects/${p.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {p.name}
                      </Link>
                      <Badge variant={STATUS_VARIANTS[p.status] as any} className="text-xs shrink-0">
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {p.progress}%
                    </span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                  {p.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Entrega: {formatDate(p.dueDate)}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Facturas recientes</CardTitle>
            <Link href="/portal/invoices">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Ver todas
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin facturas pendientes
              </p>
            ) : (
              pendingInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inv.number}</p>
                    {inv.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Vence: {formatDate(inv.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
                    <Badge variant={INVOICE_VARIANTS[inv.status] as any} className="text-xs">
                      {INVOICE_LABELS[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
            <CardDescription>Últimas actualizaciones del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                    {item.user?.name?.charAt(0) || "?"}
                  </div>
                  <p className="text-muted-foreground flex-1">
                    <span className="font-medium text-foreground">{item.user?.name}</span>
                    {" "}
                    {item.action === "CREATE" ? "creó" : item.action === "UPDATE" ? "actualizó" : "eliminó"}
                    {" "}
                    un registro en <span className="font-medium">{item.entity}</span>
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

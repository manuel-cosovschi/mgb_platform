"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Search, FolderKanban, Calendar, MoreVertical, Pause, Trash2, CheckCircle, X, ShieldX, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, initials, formatCurrency } from "@/lib/utils";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { toast } from "sonner";
import Link from "next/link";

function formatCountdown(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "vencido";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  PLANNING: { label: "Planificación", variant: "info" },
  ACTIVE: { label: "Activo", variant: "success" },
  ON_HOLD: { label: "En pausa", variant: "warning" },
  COMPLETED: { label: "Completado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "text-slate-400" },
  MEDIUM: { label: "Media", color: "text-yellow-500" },
  HIGH: { label: "Alta", color: "text-orange-500" },
  URGENT: { label: "Urgente", color: "text-red-500" },
};

// Fetches pending approval for a given project
function useProjectApproval(projectId: string, isSocio: boolean) {
  return useQuery({
    queryKey: ["project-approval", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/approvals`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isSocio,
    refetchInterval: 10_000,
  });
}

function ProjectCard({
  project,
  isSocio,
  userId,
  onRefresh,
}: {
  project: any;
  isSocio: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const status = statusConfig[project.status] ?? statusConfig.PLANNING;
  const priority = priorityConfig[project.priority] ?? priorityConfig.MEDIUM;
  const queryClient = useQueryClient();

  const { data: approval, refetch: refetchApproval } = useProjectApproval(project.id, isSocio);

  const pendingApproval = approval?.status === "PENDING" ? approval : null;
  const hasApproved = pendingApproval?.approvedBy?.includes(userId);
  const hasRejected = pendingApproval?.rejectedBy?.includes(userId);
  const approvalCount = pendingApproval?.approvedBy?.length ?? 0;
  const isRequester = pendingApproval?.requestedBy === userId;
  const countdown = formatCountdown(pendingApproval?.expiresAt);

  async function requestAction(e: React.MouseEvent, action: "DELETE" | "PAUSE") {
    e.preventDefault();
    e.stopPropagation();
    const label = action === "DELETE" ? "eliminar" : "pausar";
    const res = await fetch(`/api/projects/${project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error("Error al iniciar solicitud"); return; }
    if (data.executed) {
      toast.success(action === "DELETE" ? "Proyecto eliminado" : "Proyecto pausado");
      onRefresh();
    } else if (data.isCeoRequest) {
      toast.success(`Solicitud de ${label} iniciada. Los socios tienen 12hs para rechazarla — si no, se ejecuta automáticamente.`);
      refetchApproval();
      queryClient.invalidateQueries({ queryKey: ["project-approval", project.id] });
    } else {
      toast.success(`Solicitud de ${label} iniciada. Esperando aprobación de los demás socios (${data.approvals}/${data.total})`);
      refetchApproval();
      queryClient.invalidateQueries({ queryKey: ["project-approval", project.id] });
    }
  }

  async function approveAction(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/projects/${project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error("Error al aprobar"); return; }
    if (data.executed) {
      toast.success(data.action === "DELETE" ? "Proyecto eliminado" : "Proyecto pausado");
      onRefresh();
    } else {
      toast.success(`Aprobación registrada (${data.approvals}/${data.total})`);
      refetchApproval();
    }
  }

  async function cancelApproval(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/projects/${project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    toast.info("Solicitud cancelada");
    refetchApproval();
  }

  async function rejectAction(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/projects/${project.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT" }),
    });
    if (!res.ok) { toast.error("Error al rechazar"); return; }
    toast.success("Solicitud rechazada — el proyecto no se modificará");
    refetchApproval();
    queryClient.invalidateQueries({ queryKey: ["project-approval", project.id] });
  }

  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {project.name}
              </p>
              {project.client && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {project.client.name}
                  {project.client.company && ` · ${project.client.company}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant={status.variant as any}>{status.label}</Badge>
              {isSocio && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    {project.status !== "ON_HOLD" && (
                      <DropdownMenuItem onClick={(e) => requestAction(e, "PAUSE")} className="gap-2">
                        <Pause className="h-3.5 w-3.5" /> Pausar proyecto
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => requestAction(e, "DELETE")} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar proyecto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Pending approval banner */}
          {pendingApproval && isSocio && (
            <div
              className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  {pendingApproval.action === "DELETE" ? "⚠ Eliminar" : "⏸ Pausar"}
                  {countdown ? (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Clock className="h-3 w-3" /> {countdown}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-normal">{approvalCount}/3 aprob.</span>
                  )}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {isRequester ? (
                    /* Requester can only cancel */
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground" onClick={cancelApproval}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  ) : (
                    <>
                      {!hasApproved && !hasRejected && (
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-emerald-500 text-emerald-700 dark:text-emerald-400" onClick={approveAction}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                        </Button>
                      )}
                      {!hasRejected && (
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-red-400 text-red-600 dark:text-red-400" onClick={rejectAction}>
                          <ShieldX className="h-3 w-3 mr-1" /> Rechazar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                Pedido por <span className="font-medium text-foreground">{pendingApproval.requester?.name?.split(" ")[0]}</span>
                {hasApproved && !isRequester && " · Ya aprobaste"}
                {hasRejected && " · Ya rechazaste"}
                {countdown && !isRequester && !hasRejected && (
                  <span className="text-amber-600 dark:text-amber-500"> · Si no rechazás antes, se ejecuta automáticamente</span>
                )}
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{project.taskProgress ?? 0}%</span>
            </div>
            <Progress value={project.taskProgress ?? 0} className="h-1.5" />
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              <span>{project._count?.tasks ?? 0} tareas</span>
            </div>
            <span className={priority.color}>{priority.label}</span>
          </div>

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="h-3 w-3" />
              <span>
                {project.startDate && formatDate(project.startDate)}
                {project.startDate && project.endDate && " → "}
                {project.endDate && formatDate(project.endDate)}
              </span>
            </div>
          )}

          {/* Budget */}
          {project.budget && (
            <div className="text-xs text-muted-foreground mb-3">
              Presupuesto: {formatCurrency(project.budget, project.budgetCurrency)}
            </div>
          )}

          {/* Members */}
          {project.members?.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {project.members.slice(0, 4).map((m: any) => (
                  <Avatar key={m.employee.user.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={m.employee.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {initials(m.employee.user.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {project.members.length > 4 && (
                <span className="text-xs text-muted-foreground">+{project.members.length - 4}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const { data: session } = useSession();
  const isSocio = session?.user?.role === "SOCIO";
  const userId = session?.user?.id ?? "";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "30");
      const res = await fetch(`/api/projects?${params}`);
      return res.json();
    },
  });

  const projects = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Proyectos" }]} />
      <div className="flex-1 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="ml-auto" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo proyecto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))
            : projects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSocio={isSocio}
                  userId={userId}
                  onRefresh={refetch}
                />
              ))}

          {!isLoading && !projects.length && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <FolderKanban className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Sin proyectos</p>
              <p className="text-sm mt-1">Creá tu primer proyecto para comenzar.</p>
              <Button className="mt-4" onClick={() => setOpenCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear proyecto
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); refetch(); }}
      />
    </div>
  );
}

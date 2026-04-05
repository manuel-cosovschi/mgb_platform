"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Search, FolderKanban, Calendar, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials, formatCurrency } from "@/lib/utils";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { toast } from "sonner";
import Link from "next/link";

const statusConfig: Record<string, { label: string; variant: string; dot: string }> = {
  PLANNING: { label: "Planificación", variant: "info", dot: "bg-blue-500" },
  ACTIVE: { label: "Activo", variant: "success", dot: "bg-emerald-500" },
  ON_HOLD: { label: "En pausa", variant: "warning", dot: "bg-yellow-500" },
  COMPLETED: { label: "Completado", variant: "success", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelado", variant: "destructive", dot: "bg-red-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "text-slate-400" },
  MEDIUM: { label: "Media", color: "text-yellow-500" },
  HIGH: { label: "Alta", color: "text-orange-500" },
  URGENT: { label: "Urgente", color: "text-red-500" },
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const { data: session } = useSession();
  const isSocio = session?.user?.role === "SOCIO";

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

  async function handleDeleteProject(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Proyecto eliminado");
      refetch();
    } else {
      toast.error("Error al eliminar el proyecto");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Proyectos" }]} />
      <div className="flex-1 p-4 sm:p-6">
        {/* Toolbar */}
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

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : projects.map((project: any) => {
                const status = statusConfig[project.status] ?? statusConfig.PLANNING;
                const priority = priorityConfig[project.priority] ?? priorityConfig.MEDIUM;
                return (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
                      <CardContent className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {project.name}
                            </p>
                            {project.client && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {project.client.name}
                                {project.client.company && ` · ${project.client.company}`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={status.variant as any}>{status.label}</Badge>
                            {isSocio && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteProject(e, project.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

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
                              <span className="text-xs text-muted-foreground">
                                +{project.members.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

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

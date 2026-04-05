"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, CheckSquare, Clock } from "lucide-react";

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "Por hacer", IN_PROGRESS: "En progreso", IN_REVIEW: "En revisión",
  DONE: "Completada", BLOCKED: "Bloqueada",
};
const TASK_STATUS_VARIANTS: Record<string, string> = {
  TODO: "default", IN_PROGRESS: "info", IN_REVIEW: "warning",
  DONE: "success", BLOCKED: "destructive",
};

export default function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: project, isLoading } = useQuery({
    queryKey: ["portal-project", id],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${id}`);
      if (!r.ok) throw new Error("Proyecto no encontrado");
      return r.json();
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["portal-project-tasks", id],
    queryFn: async () => {
      const r = await fetch(`/api/tasks?projectId=${id}`);
      return r.json();
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!project) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Proyecto no encontrado</p>
      <Link href="/portal/projects">
        <Button variant="outline" className="mt-4">Volver</Button>
      </Link>
    </div>
  );

  const byStatus = tasks.reduce((acc: Record<string, any[]>, t: any) => {
    if (!acc[t.status]) acc[t.status] = [];
    acc[t.status].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
          )}
        </div>
      </div>

      {/* Overview card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant="success" className="mt-1">{project.status}</Badge>
            </div>
            {project.startDate && (
              <div>
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.startDate)}
                </p>
              </div>
            )}
            {project.dueDate && (
              <div>
                <p className="text-xs text-muted-foreground">Entrega</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.dueDate)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Tareas</p>
              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {tasks.filter((t: any) => t.status === "DONE").length}/{tasks.length} completadas
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Progreso general</span>
              <span className="text-sm font-bold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Task breakdown by status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin tareas registradas</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(byStatus).map(([status, statusTasks]: [string, any]) => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={TASK_STATUS_VARIANTS[status] as any}>
                      {TASK_STATUS_LABELS[status] || status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{statusTasks.length} tareas</span>
                  </div>
                  <div className="space-y-1.5 ml-2">
                    {statusTasks.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                        <span className="text-sm">{t.title}</span>
                        {t.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

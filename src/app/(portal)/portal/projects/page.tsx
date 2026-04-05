"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { FolderOpen, Calendar, CheckSquare } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo", IN_REVIEW: "En revisión", COMPLETED: "Completado",
  ON_HOLD: "En pausa", PLANNING: "Planificación",
};
const STATUS_VARIANTS: Record<string, string> = {
  ACTIVE: "success", IN_REVIEW: "warning", COMPLETED: "secondary",
  ON_HOLD: "default", PLANNING: "info",
};

export default function PortalProjectsPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["portal-projects"],
    queryFn: async () => {
      const r = await fetch("/api/portal/projects");
      return r.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tus proyectos</h1>
        <p className="text-muted-foreground mt-1">Estado y avance de todos tus proyectos</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Sin proyectos asignados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contactá al equipo de MGB para más información
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p: any) => {
            const doneTasks = p.tasks?.length || 0;
            const totalTasks = p._count?.tasks || 0;
            return (
              <Link key={p.id} href={`/portal/projects/${p.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold line-clamp-2">{p.name}</CardTitle>
                      <Badge variant={STATUS_VARIANTS[p.status] as any} className="shrink-0">
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progreso general</span>
                        <span className="text-xs font-medium">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {p.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(p.dueDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {doneTasks}/{totalTasks} tareas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

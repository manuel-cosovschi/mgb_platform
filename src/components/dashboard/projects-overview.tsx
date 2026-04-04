"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function ProjectsOverview() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-overview"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=5&status=ACTIVE");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "success",
    PLANNING: "info",
    ON_HOLD: "warning",
    COMPLETED: "success",
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: "Activo",
    PLANNING: "Planificación",
    ON_HOLD: "En pausa",
    COMPLETED: "Completado",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Proyectos activos</CardTitle>
          <CardDescription>Estado actual de los proyectos en curso</CardDescription>
        </div>
        <Link href="/projects" className="text-xs text-primary flex items-center gap-1 hover:underline">
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {!projects?.data?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay proyectos activos
          </div>
        ) : (
          projects.data.map((project: any) => {
            const doneCount = project._count?.tasks ?? 0;
            const progress = project.taskProgress ?? 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="block group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {project.name}
                    </p>
                    {project.client && (
                      <p className="text-xs text-muted-foreground">{project.client.name}</p>
                    )}
                  </div>
                  <Badge variant={(statusColors[project.status] ?? "secondary") as any}>
                    {statusLabels[project.status] ?? project.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1 h-1.5" />
                  <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
                </div>
                {project.endDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Entrega: {formatDate(project.endDate)}
                  </p>
                )}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Settings, Users, Calendar, BarChart2, List, Layout, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, formatDate, formatCurrency } from "@/lib/utils";
import { KanbanBoard } from "./kanban-board";
import { TaskList } from "./task-list";
import { DistributionTab } from "./distribution-tab";
import { useSession } from "next-auth/react";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  budget?: number | null;
  budgetCurrency: string;
  startDate?: Date | null;
  endDate?: Date | null;
  client?: { id: string; name: string; company?: string | null } | null;
  members: any[];
  columns: any[];
  _count: { tasks: number };
}

interface Props {
  project: Project;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  PLANNING: { label: "Planificación", variant: "info" },
  ACTIVE: { label: "Activo", variant: "success" },
  ON_HOLD: { label: "En pausa", variant: "warning" },
  COMPLETED: { label: "Completado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export function ProjectBoard({ project }: Props) {
  const [activeTab, setActiveTab] = useState("board");
  const { data: session } = useSession();
  const isSocio = session?.user?.role === "SOCIO";

  const { data: taskData, isLoading, refetch } = useQuery({
    queryKey: ["tasks", project.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${project.id}&limit=200`);
      return res.json();
    },
  });

  const tasks = taskData?.data ?? [];
  const doneTasks = tasks.filter((t: any) => t.status === "DONE").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const status = statusConfig[project.status] ?? statusConfig.PLANNING;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Project header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{project.name}</h1>
              <Badge variant={status.variant as any}>{status.label}</Badge>
              {project.client && (
                <span className="text-sm text-muted-foreground">
                  {project.client.name}
                  {project.client.company && ` · ${project.client.company}`}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </div>
            )}
            {project.budget && (
              <div>
                {formatCurrency(project.budget, project.budgetCurrency as any)}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {project.members.slice(0, 4).map((m: any) => (
                  <Avatar key={m.employee.user.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={m.employee.user.image} />
                    <AvatarFallback className="text-[10px]">{initials(m.employee.user.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {project.members.length > 4 && (
                <span className="text-xs">+{project.members.length - 4}</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-1.5 max-w-xs" />
          <span className="text-xs text-muted-foreground">
            {doneTasks}/{tasks.length} tareas · {progress}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b px-6">
          <TabsList className="h-10 bg-transparent border-0 p-0 gap-1">
            {[
              { value: "board", label: "Tablero", icon: Layout },
              { value: "list", label: "Lista", icon: List },
              { value: "distribucion", label: "Distribución", icon: DollarSign },
              { value: "analytics", label: "Analytics", icon: BarChart2 },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 gap-1.5 px-3"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="board" className="flex-1 overflow-hidden m-0">
          <KanbanBoard
            columns={project.columns}
            tasks={tasks}
            isLoading={isLoading}
            projectId={project.id}
            onUpdate={refetch}
          />
        </TabsContent>

        <TabsContent value="list" className="flex-1 overflow-auto m-0 p-6">
          <TaskList tasks={tasks} isLoading={isLoading} onUpdate={refetch} />
        </TabsContent>

        <TabsContent value="distribucion" className="flex-1 overflow-auto m-0">
          <DistributionTab
            projectId={project.id}
            projectSlug={project.id}
            budgetCurrency={project.budgetCurrency}
            isSocio={isSocio}
          />
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-auto m-0 p-6">
          <div className="text-center py-16 text-muted-foreground">
            <BarChart2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>Analytics del proyecto — próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

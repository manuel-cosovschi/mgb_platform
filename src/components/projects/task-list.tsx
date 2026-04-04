"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/utils";
import { CheckSquare, MessageSquare, Paperclip } from "lucide-react";

interface Props {
  tasks: any[];
  isLoading: boolean;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  BACKLOG: { label: "Backlog", variant: "secondary" },
  TODO: { label: "Por hacer", variant: "secondary" },
  IN_PROGRESS: { label: "En progreso", variant: "info" },
  IN_REVIEW: { label: "En revisión", variant: "purple" },
  BLOCKED: { label: "Bloqueada", variant: "destructive" },
  DONE: { label: "Completada", variant: "success" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "text-slate-400" },
  MEDIUM: { label: "Media", color: "text-yellow-500" },
  HIGH: { label: "Alta", color: "text-orange-500" },
  URGENT: { label: "Urgente", color: "text-red-500" },
};

export function TaskList({ tasks, isLoading, onUpdate }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <CheckSquare className="mx-auto h-10 w-10 mb-2 opacity-30" />
        <p>Sin tareas</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium text-muted-foreground">Tarea</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Estado</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Prioridad</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Asignado</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Vencimiento</th>
            <th className="p-3 text-right font-medium text-muted-foreground hidden xl:table-cell">Horas</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const status = statusConfig[task.status] ?? statusConfig.TODO;
            const priority = priorityConfig[task.priority] ?? priorityConfig.MEDIUM;
            return (
              <tr
                key={task.id}
                className="border-b hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-xs">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {task._count?.comments > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {task._count.comments}
                          </span>
                        )}
                        {task._count?.attachments > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Paperclip className="h-3 w-3" />
                            {task._count.attachments}
                          </span>
                        )}
                        {task._count?.subtasks > 0 && (
                          <span className="flex items-center gap-0.5">
                            <CheckSquare className="h-3 w-3" />
                            {task._count.subtasks}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <Badge variant={status.variant as any}>{status.label}</Badge>
                </td>
                <td className={`p-3 hidden lg:table-cell text-xs font-medium ${priority.color}`}>
                  {priority.label}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <div className="flex -space-x-1.5">
                    {task.assignments?.slice(0, 3).map(({ user }: any) => (
                      <Avatar key={user.id} className="h-6 w-6 border border-background">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="text-[10px]">{initials(user.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </td>
                <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </td>
                <td className="p-3 hidden xl:table-cell text-right text-xs text-muted-foreground">
                  {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

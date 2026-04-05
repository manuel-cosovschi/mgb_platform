"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, formatDate } from "@/lib/utils";
import { TaskDetailModal } from "./task-detail-modal";

interface Column {
  id: string;
  name: string;
  order: number;
  color?: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  columnId?: string | null;
  assignments: Array<{ user: { id: string; name: string; image?: string | null } }>;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  _count: { comments: number; subtasks: number };
}

interface Props {
  columns: Column[];
  tasks: Task[];
  isLoading: boolean;
  projectId: string;
  onUpdate: () => void;
}

const priorityColors: Record<string, string> = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-yellow-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-red-500",
};

export function KanbanBoard({ columns, tasks, isLoading, projectId, onUpdate }: Props) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.columnId === col.id);
    return acc;
  }, {} as Record<string, Task[]>);

  async function createTask(columnId: string) {
    if (!newTaskTitle.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        columnId,
        title: newTaskTitle.trim(),
        status: columnId ? "TODO" : "BACKLOG",
      }),
    });

    if (res.ok) {
      setNewTaskTitle("");
      setAddingToColumn(null);
      onUpdate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto h-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-72 shrink-0">
            <Skeleton className="h-8 w-full mb-3" />
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-24 w-full mb-2" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-6 overflow-x-auto h-full items-start">
      {columns.map((column) => {
        const colTasks = tasksByColumn[column.id] ?? [];
        return (
          <div key={column.id} className="w-72 shrink-0 flex flex-col max-h-full">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{column.name}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                  {colTasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setAddingToColumn(column.id)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Tasks */}
            <div className="space-y-2 overflow-y-auto flex-1">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border bg-card p-3 cursor-pointer hover:shadow-md transition-all border-l-2 ${priorityColors[task.priority] ?? "border-l-slate-400"}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <p className="text-sm font-medium mb-2">{task.title}</p>

                  {task.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.labels.map(({ label }) => (
                        <span
                          key={label.id}
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: `${label.color}20`, color: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {task.assignments?.slice(0, 3).map(({ user }) => (
                        <Avatar key={user.id} className="h-5 w-5 border border-background">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-[9px]">{initials(user.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span>{formatDate(task.dueDate)}</span>
                      )}
                      {task._count?.comments > 0 && (
                        <span>{task._count.comments} 💬</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick add form */}
              {addingToColumn === column.id ? (
                <div className="rounded-lg border bg-card p-2">
                  <input
                    autoFocus
                    className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    placeholder="Título de la tarea..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createTask(column.id);
                      if (e.key === "Escape") {
                        setAddingToColumn(null);
                        setNewTaskTitle("");
                      }
                    }}
                  />
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => createTask(column.id)}>
                      Agregar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => { setAddingToColumn(null); setNewTaskTitle(""); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground text-xs h-8"
                  onClick={() => setAddingToColumn(column.id)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar tarea
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}

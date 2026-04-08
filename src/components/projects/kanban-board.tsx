"use client";

import { useState } from "react";
import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, formatDate } from "@/lib/utils";
import { TaskDetailModal } from "./task-detail-modal";
import { toast } from "sonner";

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

interface DistributionOwner {
  assignedTo: string;
  assignedName: string;
  color: { bg: string; text: string; light: string; border: string };
}

interface Props {
  columns: Column[];
  tasks: Task[];
  isLoading: boolean;
  projectId: string;
  currentUserId?: string;
  distributionMap?: Record<string, DistributionOwner>;
  poolExists?: boolean;
  onUpdate: () => void;
}

// column.order → task status (matches the 5 default columns created at project creation)
const ORDER_TO_STATUS: Record<number, string> = {
  0: "BACKLOG",
  1: "TODO",
  2: "IN_PROGRESS",
  3: "IN_REVIEW",
  4: "DONE",
};

const priorityColors: Record<string, string> = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-yellow-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-red-500",
};

const priorityDotColors: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

export function KanbanBoard({
  columns,
  tasks,
  isLoading,
  projectId,
  currentUserId,
  distributionMap = {},
  poolExists = false,
  onUpdate,
}: Props) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    canEdit: boolean;
    ownerName?: string;
  } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

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
        status: ORDER_TO_STATUS[columns.find((c) => c.id === columnId)?.order ?? 1] ?? "TODO",
      }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      setAddingToColumn(null);
      onUpdate();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Error al crear la tarea");
    }
  }

  async function handleDrop(columnId: string, columnOrder: number) {
    if (!dragging) return;
    setDragging(null);
    setDragOver(null);

    // Client-side ownership guard (server also enforces)
    const dist = distributionMap[dragging];
    if (dist && dist.assignedTo !== currentUserId) {
      toast.error("No podés mover tareas de otros socios");
      return;
    }

    const task = tasks.find((t) => t.id === dragging);
    if (task?.columnId === columnId) return; // same column — no-op

    const status = ORDER_TO_STATUS[columnOrder] ?? "TODO";
    const res = await fetch(`/api/tasks/${dragging}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, status }),
    });

    if (res.ok) {
      onUpdate();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Error al mover la tarea");
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
        const isDropTarget = dragOver === column.id && !!dragging;

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
              {/* Only show the + button when pool is not active */}
              {!poolExists && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddingToColumn(column.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={`space-y-2 overflow-y-auto flex-1 rounded-lg transition-colors duration-100 ${
                isDropTarget ? "bg-primary/5 ring-1 ring-primary/20" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOver !== column.id) setDragOver(column.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(column.id, column.order);
              }}
            >
              {/* Drop indicator line */}
              {isDropTarget && (
                <div className="h-0.5 bg-primary/40 rounded-full mx-1" />
              )}

              {colTasks.map((task) => {
                const dist = distributionMap[task.id];
                const isOwned = !!dist;
                const isMyTask = dist?.assignedTo === currentUserId;
                const canEdit = !isOwned || isMyTask;

                const leftBorderClass = isOwned
                  ? `border-l-2 ${dist.color.border}`
                  : `border-l-2 ${priorityColors[task.priority] ?? "border-l-slate-400"}`;

                const isDraggingThis = dragging === task.id;

                return (
                  <div
                    key={task.id}
                    draggable={canEdit}
                    onDragStart={(e) => {
                      setDragging(task.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", task.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onClick={() =>
                      setSelectedTask({ id: task.id, canEdit, ownerName: dist?.assignedName })
                    }
                    className={`
                      rounded-lg border bg-card p-3 transition-all select-none
                      ${leftBorderClass}
                      ${canEdit
                        ? "cursor-grab active:cursor-grabbing hover:shadow-md"
                        : "cursor-pointer hover:shadow-sm"
                      }
                      ${isDraggingThis ? "opacity-40 scale-[0.97] shadow-none" : ""}
                      ${isOwned && !isMyTask ? "opacity-75" : ""}
                    `}
                  >
                    {/* Title row */}
                    <div className="flex items-start gap-1.5 mb-2">
                      <p className="text-sm font-medium flex-1 leading-snug">{task.title}</p>
                      {isOwned && !isMyTask && (
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Labels */}
                    {task.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.labels.map(({ label }) => (
                          <span
                            key={label.id}
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-1">
                      {isOwned ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${dist.color.bg}`} />
                          <span className={`text-[10px] font-medium ${dist.color.text}`}>
                            {isMyTask ? "Tuya" : dist.assignedName.split(" ")[0]}
                          </span>
                        </div>
                      ) : (
                        <div className="flex -space-x-1.5">
                          {task.assignments?.slice(0, 3).map(({ user }) => (
                            <Avatar key={user.id} className="h-5 w-5 border border-background">
                              <AvatarImage src={user.image ?? undefined} />
                              <AvatarFallback className="text-[9px]">
                                {initials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {!isOwned && (
                          <div
                            className={`h-2 w-2 rounded-full ${priorityDotColors[task.priority] ?? "bg-slate-400"}`}
                          />
                        )}
                        {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
                        {task._count?.comments > 0 && (
                          <span>{task._count.comments} 💬</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Task creation — hidden when pool is active */}
              {!poolExists ? (
                addingToColumn === column.id ? (
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
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => createTask(column.id)}
                      >
                        Agregar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setAddingToColumn(null);
                          setNewTaskTitle("");
                        }}
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
                )
              ) : (
                colTasks.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-muted-foreground/60">
                    Sin tareas
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}

      <TaskDetailModal
        taskId={selectedTask?.id ?? null}
        canEdit={selectedTask?.canEdit ?? true}
        ownerName={selectedTask?.ownerName}
        onClose={() => setSelectedTask(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}

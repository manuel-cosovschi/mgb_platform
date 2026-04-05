"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Clock, Flag, Tag, User, MessageSquare,
  CheckSquare, Paperclip, X, Plus, Trash2, Edit2, Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime, initials } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  taskId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const statusOptions = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Por hacer" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "DONE", label: "Completada" },
];

const priorityOptions = [
  { value: "LOW", label: "Baja", color: "text-slate-400" },
  { value: "MEDIUM", label: "Media", color: "text-yellow-400" },
  { value: "HIGH", label: "Alta", color: "text-orange-400" },
  { value: "URGENT", label: "Urgente", color: "text-red-500" },
];

const statusColors: Record<string, string> = {
  BACKLOG: "secondary", TODO: "secondary", IN_PROGRESS: "info",
  IN_REVIEW: "purple", BLOCKED: "destructive", DONE: "success",
};

export function TaskDetailModal({ taskId, onClose, onUpdate }: Props) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheck, setAddingCheck] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      return res.json();
    },
    enabled: !!taskId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["task", taskId] });
    onUpdate();
  };

  async function updateTask(data: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) invalidate();
    else toast.error("Error al actualizar");
  }

  async function submitComment() {
    if (!comment.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    if (res.ok) { setComment(""); invalidate(); }
  }

  async function toggleCheckItem(itemId: string, isCompleted: boolean) {
    await fetch(`/api/tasks/${taskId}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, isCompleted }),
    });
    invalidate();
  }

  async function addCheckItem() {
    if (!newCheckItem.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCheckItem }),
    });
    if (res.ok) { setNewCheckItem(""); setAddingCheck(false); invalidate(); }
  }

  async function deleteTask() {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    toast.success("Tarea eliminada");
    onClose();
    onUpdate();
  }

  const checkProgress = task?.checklistItems?.length > 0
    ? Math.round((task.checklistItems.filter((i: any) => i.isCompleted).length / task.checklistItems.length) * 100)
    : 0;

  return (
    <Dialog open={!!taskId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 p-6 pb-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask({ status: e.target.value })}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={task.priority}
                    onChange={(e) => updateTask({ priority: e.target.value })}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">{task.project?.name}</span>
                </div>
                <h2 className="text-lg font-semibold leading-tight">{task.title}</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deleteTask}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Main content */}
              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
                {/* Description */}
                {task.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1.5">Descripción</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                {/* Checklist */}
                {(task.checklistItems?.length > 0 || true) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Checklist
                        {task.checklistItems?.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {task.checklistItems.filter((i: any) => i.isCompleted).length}/{task.checklistItems.length}
                          </span>
                        )}
                      </h3>
                    </div>
                    {task.checklistItems?.length > 0 && (
                      <Progress value={checkProgress} className="h-1 mb-3" />
                    )}
                    <div className="space-y-1.5">
                      {task.checklistItems?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={(e) => toggleCheckItem(item.id, e.target.checked)}
                            className="h-4 w-4 rounded accent-primary cursor-pointer"
                          />
                          <span className={`text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </span>
                        </div>
                      ))}
                      {addingCheck ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            autoFocus
                            className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                            placeholder="Nuevo ítem..."
                            value={newCheckItem}
                            onChange={(e) => setNewCheckItem(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addCheckItem();
                              if (e.key === "Escape") { setAddingCheck(false); setNewCheckItem(""); }
                            }}
                          />
                          <Button size="sm" className="h-7" onClick={addCheckItem}><Check className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setAddingCheck(false)}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setAddingCheck(true)}>
                          <Plus className="h-3 w-3 mr-1" /> Agregar ítem
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentarios ({task.comments?.length ?? 0})
                  </h3>
                  <div className="space-y-3 mb-4">
                    {task.comments?.map((c: any) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={c.author.image} />
                          <AvatarFallback className="text-xs">{initials(c.author.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 rounded-lg bg-muted px-3 py-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium">{c.author.name}</span>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                          </div>
                          <p className="text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      className="flex-1 text-sm border rounded-md px-3 py-2 bg-background resize-none min-h-[68px]"
                      placeholder="Escribí un comentario..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submitComment(); }}
                    />
                    <Button size="sm" onClick={submitComment} disabled={!comment.trim()}>
                      Enviar
                    </Button>
                  </div>
                </div>

                {/* Subtasks */}
                {task.subtasks?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Subtareas ({task.subtasks.length})</h3>
                    <div className="space-y-1.5">
                      {task.subtasks.map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <Badge variant={(statusColors[sub.status] ?? "secondary") as any} className="text-xs">
                            {sub.status}
                          </Badge>
                          <span className="flex-1 truncate">{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar meta */}
              <div className="w-56 border-l p-4 space-y-5 overflow-y-auto shrink-0">
                {/* Assignees */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Asignados
                  </p>
                  <div className="space-y-1.5">
                    {task.assignments?.map(({ user }: any) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="text-[10px]">{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user.name}</span>
                      </div>
                    ))}
                    {!task.assignments?.length && (
                      <p className="text-xs text-muted-foreground">Sin asignar</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Fechas
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {task.startDate && (
                      <div><span className="text-muted-foreground">Inicio:</span> {formatDate(task.startDate)}</div>
                    )}
                    {task.dueDate && (
                      <div><span className="text-muted-foreground">Vence:</span> {formatDate(task.dueDate)}</div>
                    )}
                    {!task.startDate && !task.dueDate && (
                      <p className="text-muted-foreground">Sin fechas</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Hours */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Horas
                  </p>
                  <div className="text-xs space-y-1">
                    <div><span className="text-muted-foreground">Estimadas:</span> {task.estimatedHours ?? "—"}h</div>
                    <div><span className="text-muted-foreground">Reales:</span> {task.actualHours ?? "—"}h</div>
                    {task.estimatedHours && task.actualHours && (
                      <Progress
                        value={Math.min(100, (task.actualHours / task.estimatedHours) * 100)}
                        className="h-1 mt-1"
                      />
                    )}
                  </div>
                </div>

                {/* Labels */}
                {task.labels?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Etiquetas
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {task.labels.map(({ label }: any) => (
                          <span
                            key={label.id}
                            className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                            style={{ backgroundColor: `${label.color}25`, color: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground">
                  Creada {formatRelativeTime(task.createdAt)}
                  {task.updatedAt !== task.createdAt && (
                    <div>Modificada {formatRelativeTime(task.updatedAt)}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

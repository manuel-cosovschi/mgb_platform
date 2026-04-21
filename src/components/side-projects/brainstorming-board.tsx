"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdeaCard } from "./idea-card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type SideProjectStatus = "IDEA" | "EVALUATING" | "VALIDATING" | "PRIORITIZED" | "IN_DEVELOPMENT" | "LAUNCHED" | "ARCHIVED";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  problem?: string | null;
  status: string;
  type: string;
  score: number;
  complexity: number;
  revenuePotential: number;
  synergy: number;
  risk: string;
  timeEstimate?: string | null;
  createdAt: string | Date;
  owner: { id: string; name: string; image?: string | null };
  votes: { userId: string }[];
  _count?: { tasks: number; notes: number };
}

const COLUMNS: { id: SideProjectStatus; label: string; color: string }[] = [
  { id: "IDEA",           label: "Idea nueva",    color: "border-slate-300 bg-slate-50 dark:bg-slate-900/30" },
  { id: "EVALUATING",     label: "Evaluando",     color: "border-blue-300 bg-blue-50 dark:bg-blue-950/20" },
  { id: "VALIDATING",     label: "Validando",     color: "border-purple-300 bg-purple-50 dark:bg-purple-950/20" },
  { id: "PRIORITIZED",    label: "Priorizada",    color: "border-orange-300 bg-orange-50 dark:bg-orange-950/20" },
  { id: "IN_DEVELOPMENT", label: "En desarrollo", color: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" },
  { id: "LAUNCHED",       label: "Lanzada",       color: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" },
  { id: "ARCHIVED",       label: "Archivada",     color: "border-gray-200 bg-gray-50 dark:bg-gray-900/20" },
];

interface BrainstormingBoardProps {
  projects: Project[];
  currentUserId?: string;
  onVote: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: (status?: SideProjectStatus) => void;
  onStatusChange?: (id: string, status: SideProjectStatus) => void;
}

export function BrainstormingBoard({
  projects,
  currentUserId,
  onVote,
  onEdit,
  onDelete,
  onNew,
  onStatusChange,
}: BrainstormingBoardProps) {
  const [optimisticItems, setOptimisticItems] = useState<Project[]>(projects);

  // Sync when projects prop changes
  if (JSON.stringify(projects.map((p) => p.id)) !== JSON.stringify(optimisticItems.map((p) => p.id))) {
    setOptimisticItems(projects);
  }

  const grouped = useCallback(() => {
    const map: Record<string, Project[]> = {};
    for (const col of COLUMNS) map[col.id] = [];
    for (const p of optimisticItems) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [optimisticItems]);

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as SideProjectStatus;

    const item = optimisticItems.find((p) => p.id === draggableId);
    if (!item || item.status === newStatus) return;

    setOptimisticItems((prev) =>
      prev.map((p) => (p.id === draggableId ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/side-projects/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      onStatusChange?.(draggableId, newStatus);
      toast.success("Estado actualizado");
    } catch {
      setOptimisticItems(projects);
      toast.error("Error al actualizar el estado");
    }
  }

  const columnData = grouped();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {COLUMNS.map((col) => {
          const items = columnData[col.id] ?? [];
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className={cn("rounded-xl border-2 flex flex-col h-full min-h-[400px]", col.color)}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{col.label}</span>
                    <Badge variant="secondary" className="h-5 text-xs px-1.5">{items.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onNew(col.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-2 space-y-2 overflow-y-auto transition-colors rounded-b-xl",
                        snapshot.isDraggingOver && "bg-black/5 dark:bg-white/5"
                      )}
                    >
                      {items.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                            >
                              <IdeaCard
                                project={project}
                                currentUserId={currentUserId}
                                onVote={onVote}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                dragging={snap.isDragging}
                                compact
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground text-center px-2">
                          Arrastrá ideas aquí
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

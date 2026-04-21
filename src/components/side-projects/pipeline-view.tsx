"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, TypeBadge } from "./status-badge";
import { ScoreBadge } from "./score-badge";
import { GripVertical, Flame, Star, Clock, Archive, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PipelineProject {
  id: string;
  title: string;
  type: string;
  status: string;
  score: number;
  complexity: number;
  revenuePotential: number;
  synergy: number;
  risk: string;
  timeEstimate?: string | null;
  priorityOrder: number;
  owner: { id: string; name: string };
}

const PIPELINE_LANES = [
  { id: "active",  label: "Proyecto actual",    icon: Flame,  color: "border-yellow-400", statuses: ["IN_DEVELOPMENT"] },
  { id: "next",    label: "Próximo",             icon: Star,   color: "border-blue-400",   statuses: ["PRIORITIZED"] },
  { id: "after",   label: "Después",             icon: Clock,  color: "border-purple-400", statuses: ["VALIDATING"] },
  { id: "backlog", label: "Backlog",             icon: Layers, color: "border-slate-400",  statuses: ["IDEA", "EVALUATING"] },
  { id: "icebox",  label: "Icebox",              icon: Archive,color: "border-gray-300",   statuses: ["ARCHIVED"] },
];

function getLane(status: string) {
  return PIPELINE_LANES.find((l) => l.statuses.includes(status))?.id ?? "backlog";
}

interface PipelineViewProps {
  projects: PipelineProject[];
  onReorder?: () => void;
}

export function PipelineView({ projects: initialProjects, onReorder }: PipelineViewProps) {
  const [items, setItems] = useState(
    [...initialProjects].sort((a, b) => a.priorityOrder - b.priorityOrder)
  );

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index && source.droppableId === destination.droppableId) return;

    const newItems = Array.from(items);
    const [moved] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, moved);
    const reordered = newItems.map((item, i) => ({ ...item, priorityOrder: i + 1 }));
    setItems(reordered);

    try {
      const res = await fetch("/api/side-projects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((p) => ({ id: p.id, priorityOrder: p.priorityOrder })) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pipeline actualizado");
      onReorder?.();
    } catch {
      setItems(initialProjects);
      toast.error("Error al reordenar");
    }
  }

  const laneItems: Record<string, PipelineProject[]> = {};
  for (const lane of PIPELINE_LANES) laneItems[lane.id] = [];
  for (const item of items) laneItems[getLane(item.status)].push(item);

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {PIPELINE_LANES.map((lane) => {
          const Icon = lane.icon;
          const laneProjects = laneItems[lane.id] ?? [];
          return (
            <Card key={lane.id} className={cn("border-l-4", lane.color)}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {lane.label}
                  <Badge variant="secondary" className="ml-auto text-xs h-5">{laneProjects.length}</Badge>
                </CardTitle>
              </CardHeader>
              <Droppable droppableId={lane.id} direction="vertical">
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn("px-4 pb-3 space-y-2 min-h-[40px] transition-colors rounded-b-lg", snapshot.isDraggingOver && "bg-muted/50")}
                  >
                    {laneProjects.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg bg-card border hover:shadow-sm transition-all",
                              snap.isDragging && "shadow-md rotate-1"
                            )}
                          >
                            <div {...prov.dragHandleProps} className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <span className="text-xs text-muted-foreground w-5 text-center font-medium">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <Link href={`/side-projects/${project.id}`} className="font-medium text-sm hover:text-primary transition-colors truncate block">
                                {project.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <TypeBadge type={project.type as Parameters<typeof TypeBadge>[0]["type"]} />
                                <StatusBadge status={project.status as Parameters<typeof StatusBadge>[0]["status"]} />
                              </div>
                            </div>
                            <ScoreBadge
                              input={{ revenuePotential: project.revenuePotential, complexity: project.complexity, synergy: project.synergy, risk: project.risk as "LOW"|"MEDIUM"|"HIGH", timeEstimate: project.timeEstimate }}
                              size="sm"
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {laneProjects.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Sin proyectos en esta etapa</p>
                    )}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          );
        })}
      </DragDropContext>
    </div>
  );
}

"use client";

import { IdeaCard } from "./idea-card";

interface SideProjectData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  emoji?: string | null;
  status: string;
  type: string;
  priority: string;
  totalScore: number;
  tags: string[];
  pipelineOrder?: number;
  votes?: { userId: string }[];
  _count?: { votes: number; tasks: number; notes: number };
  createdBy?: { name: string; image?: string | null };
}

const PIPELINE_LANES = [
  { priority: "P1_NOW", title: "🔴 P1 — Ahora", color: "#ef4444" },
  { priority: "P2_NEXT", title: "🟡 P2 — Siguiente", color: "#f59e0b" },
  { priority: "P3_LATER", title: "🔵 P3 — Después", color: "#3b82f6" },
  { priority: "P4_MAYBE", title: "⚪ P4 — Quizás", color: "#6b7280" },
  { priority: "P5_SOMEDAY", title: "💤 P5 — Algún día", color: "#9ca3af" },
];

interface PipelineViewProps {
  projects: SideProjectData[];
  currentUserId?: string;
  onVote?: (id: string) => void;
  onEdit?: (project: SideProjectData) => void;
  onDelete?: (id: string) => void;
  onPriorityChange?: (id: string, newPriority: string) => void;
}

export function PipelineView({
  projects, currentUserId, onVote, onEdit, onDelete, onPriorityChange,
}: PipelineViewProps) {
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId);
  };

  const handleDrop = (e: React.DragEvent, priority: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("text/plain");
    if (projectId && onPriorityChange) onPriorityChange(projectId, priority);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {PIPELINE_LANES.map(({ priority, title, color }) => {
        const laneProjects = projects
          .filter((p) => p.priority === priority)
          .sort((a, b) => (a.pipelineOrder ?? 0) - (b.pipelineOrder ?? 0));
        return (
          <div key={priority} className="rounded-xl border overflow-hidden" onDrop={(e) => handleDrop(e, priority)} onDragOver={handleDragOver}>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium text-sm">{title}</span>
              <span className="text-xs text-muted-foreground">{laneProjects.length} ideas</span>
            </div>
            <div className="p-3">
              {laneProjects.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border-2 border-dashed rounded-lg">Arrastrá ideas aquí</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {laneProjects.map((project) => (
                    <div key={project.id} draggable onDragStart={(e) => handleDragStart(e, project.id)} className="cursor-grab active:cursor-grabbing">
                      <IdeaCard project={project} currentUserId={currentUserId} onVote={onVote} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

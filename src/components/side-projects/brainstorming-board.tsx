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
  votes?: { userId: string }[];
  _count?: { votes: number; tasks: number; notes: number };
  createdBy?: { name: string; image?: string | null };
}

const BOARD_COLUMNS = [
  { status: "IDEA", title: "💡 Ideas", color: "#6b7280" },
  { status: "EVALUATING", title: "🔍 Evaluando", color: "#3b82f6" },
  { status: "APPROVED", title: "✅ Aprobadas", color: "#22c55e" },
  { status: "IN_DEVELOPMENT", title: "🛠️ En desarrollo", color: "#8b5cf6" },
  { status: "MVP_READY", title: "🚀 MVP Listo", color: "#f59e0b" },
  { status: "LAUNCHED", title: "🎯 Lanzados", color: "#10b981" },
  { status: "PAUSED", title: "⏸️ Pausados", color: "#9ca3af" },
];

interface BrainstormingBoardProps {
  projects: SideProjectData[];
  currentUserId?: string;
  onVote?: (id: string) => void;
  onEdit?: (project: SideProjectData) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function BrainstormingBoard({
  projects, currentUserId, onVote, onEdit, onDelete, onStatusChange,
}: BrainstormingBoardProps) {
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("text/plain");
    if (projectId && onStatusChange) {
      onStatusChange(projectId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {BOARD_COLUMNS.map(({ status, title, color }) => {
        const columnProjects = projects.filter((p) => p.status === status);
        return (
          <div
            key={status}
            className="flex-shrink-0 w-[280px] flex flex-col rounded-xl border bg-muted/30"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium">{title}</span>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {columnProjects.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {columnProjects.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                  Arrastrá ideas aquí
                </div>
              ) : (
                columnProjects.map((project) => (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <IdeaCard
                      project={project}
                      currentUserId={currentUserId}
                      onVote={onVote}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Heart, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./score-display";
import { StatusBadge, TypeBadge, PriorityBadge } from "./badges";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IdeaCardProps {
  project: {
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
  };
  currentUserId?: string;
  onVote?: (id: string) => void;
  onEdit?: (project: IdeaCardProps["project"]) => void;
  onDelete?: (id: string) => void;
}

export function IdeaCard({ project, currentUserId, onVote, onEdit, onDelete }: IdeaCardProps) {
  const hasVoted = project.votes?.some((v) => v.userId === currentUserId);
  const voteCount = project._count?.votes ?? project.votes?.length ?? 0;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30">
      {/* Color accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />

      <CardContent className="p-4 pt-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{project.emoji || "💡"}</span>
            <Link
              href={`/side-projects/${project.id}`}
              className="font-semibold text-sm hover:text-primary truncate transition-colors"
            >
              {project.title}
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/side-projects/${project.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(project.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={project.status} />
          <TypeBadge type={project.type} />
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{project.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 gap-1 text-xs ${hasVoted ? "text-pink-500" : "text-muted-foreground"}`}
              onClick={() => onVote?.(project.id)}
            >
              <Heart className={`h-3.5 w-3.5 ${hasVoted ? "fill-pink-500" : ""}`} />
              {voteCount}
            </Button>
            <PriorityBadge priority={project.priority} />
          </div>
          <ScoreBadge score={project.totalScore} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}

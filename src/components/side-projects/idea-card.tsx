"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge, TypeBadge } from "./status-badge";
import { ScoreBadge } from "./score-badge";
import { ThumbsUp, MessageSquare, ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { initials } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface IdeaCardProps {
  project: {
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
  };
  currentUserId?: string;
  onVote?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  dragging?: boolean;
  compact?: boolean;
}

export function IdeaCard({ project, currentUserId, onVote, onEdit, onDelete, dragging, compact }: IdeaCardProps) {
  const hasVoted = currentUserId ? project.votes.some((v) => v.userId === currentUserId) : false;
  const voteCount = project.votes.length;

  return (
    <Card className={cn(
      "group transition-all hover:shadow-md border",
      dragging && "shadow-lg rotate-1 scale-105",
      project.status === "ARCHIVED" && "opacity-60",
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status as Parameters<typeof StatusBadge>[0]["status"]} />
            <TypeBadge type={project.type as Parameters<typeof TypeBadge>[0]["type"]} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/side-projects/${project.id}`}>
                  <ArrowRight className="mr-2 h-3.5 w-3.5" /> Ver detalle
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project.id)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(project.id)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Archivar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/side-projects/${project.id}`} className="block group/title">
          <h3 className="font-semibold text-sm leading-snug group-hover/title:text-primary transition-colors mb-1">
            {project.title}
          </h3>
        </Link>

        {!compact && project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}
        {!compact && project.problem && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-3 italic">
            Problema: {project.problem}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <ScoreBadge
            input={{
              revenuePotential: project.revenuePotential,
              complexity: project.complexity,
              synergy: project.synergy,
              risk: project.risk as "LOW" | "MEDIUM" | "HIGH",
              timeEstimate: project.timeEstimate,
            }}
            showBreakdown
            size="sm"
          />

          <div className="flex items-center gap-2">
            {project._count && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {project._count.notes}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 gap-1 px-2 text-xs", hasVoted && "text-primary")}
              onClick={() => onVote?.(project.id)}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {voteCount}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={project.owner.image ?? undefined} />
              <AvatarFallback className="text-[9px]">{initials(project.owner.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{project.owner.name.split(" ")[0]}</span>
          </div>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(project.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

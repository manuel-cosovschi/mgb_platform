"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";
import { Building2 } from "lucide-react";

const STAGES = [
  { id: "LEAD", label: "Lead", color: "bg-slate-500/20 text-slate-400" },
  { id: "CONTACTED", label: "Contactado", color: "bg-blue-500/20 text-blue-400" },
  { id: "PROPOSAL_SENT", label: "Propuesta enviada", color: "bg-yellow-500/20 text-yellow-400" },
  { id: "NEGOTIATION", label: "Negociación", color: "bg-orange-500/20 text-orange-400" },
  { id: "WON", label: "Ganado", color: "bg-emerald-500/20 text-emerald-400" },
  { id: "LOST", label: "Perdido", color: "bg-red-500/20 text-red-400" },
];

interface Props {
  clients: any[];
  isLoading: boolean;
  onUpdate: () => void;
}

export function CRMKanban({ clients, isLoading, onUpdate }: Props) {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage.id} className="w-64 shrink-0">
            <Skeleton className="h-8 w-full mb-3" />
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full mb-2" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const clientsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = clients.filter((c) => c.stage === stage.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageClients = clientsByStage[stage.id] ?? [];
        return (
          <div key={stage.id} className="w-64 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.color}`}>
                  {stage.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{stageClients.length}</span>
            </div>

            <div className="space-y-2">
              {stageClients.map((client) => (
                <a
                  key={client.id}
                  href={`/crm/${client.id}`}
                  className="block rounded-lg border bg-card p-3 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{initials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {client.name}
                      </p>
                      {client.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="h-2.5 w-2.5" />
                          {client.company}
                        </p>
                      )}
                    </div>
                  </div>
                  {client.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}

              {stageClients.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Sin clientes
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

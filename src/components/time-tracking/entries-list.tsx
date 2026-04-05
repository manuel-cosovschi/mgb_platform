"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, DollarSign, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m`;
}

interface Props {
  refreshKey?: number;
}

export function EntriesList({ refreshKey }: Props) {
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries-recent", refreshKey],
    queryFn: async () => {
      const res = await fetch("/api/time-entries?limit=30");
      return res.json();
    },
  });

  async function deleteEntry(id: string) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["time-entries-recent"] });
    toast.success("Entrada eliminada");
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm">
        Sin entradas de tiempo registradas
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium text-muted-foreground">Descripción</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Proyecto</th>
            <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Inicio</th>
            <th className="p-3 text-center font-medium text-muted-foreground">Duración</th>
            <th className="p-3 text-center font-medium text-muted-foreground">Facturable</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e: any) => (
            <tr key={e.id} className="border-b hover:bg-accent/30 transition-colors">
              <td className="p-3">
                <p className="font-medium truncate max-w-xs">{e.description || <span className="text-muted-foreground italic">Sin descripción</span>}</p>
                {e.task && <p className="text-xs text-muted-foreground mt-0.5">{e.task.title}</p>}
              </td>
              <td className="p-3 hidden md:table-cell">
                {e.project ? (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FolderKanban className="h-3 w-3" />
                    <span className="text-xs">{e.project.name}</span>
                  </div>
                ) : "—"}
              </td>
              <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                {formatDateTime(e.startTime)}
              </td>
              <td className="p-3 text-center font-mono text-sm font-medium">
                {e.isRunning ? (
                  <Badge variant="success" className="text-xs">En curso</Badge>
                ) : formatDuration(e.duration)}
              </td>
              <td className="p-3 text-center">
                {e.isBillable ? (
                  <DollarSign className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <span className="text-xs text-muted-foreground">No</span>
                )}
              </td>
              <td className="p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteEntry(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

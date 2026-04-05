"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  onUpdate: () => void;
}

export function TimerWidget({ onUpdate }: Props) {
  const qc = useQueryClient();
  const [description, setDescription] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: running } = useQuery({
    queryKey: ["running-timer"],
    queryFn: async () => {
      const res = await fetch("/api/time-entries?running=true&limit=1");
      const data = await res.json();
      return data[0] ?? null;
    },
    refetchInterval: 10_000,
  });

  // Sync elapsed from running entry
  useEffect(() => {
    if (running) {
      const start = new Date(running.startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running?.id]);

  async function start() {
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", description }),
    });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ["running-timer"] });
      onUpdate();
    }
  }

  async function stop() {
    if (!running) return;
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", entryId: running.id }),
    });
    if (res.ok) {
      toast.success(`Tiempo guardado: ${formatDuration(elapsed)}`);
      setDescription("");
      qc.invalidateQueries({ queryKey: ["running-timer"] });
      onUpdate();
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Timer className="h-5 w-5 text-primary shrink-0" />

      <div className="flex-1 min-w-0">
        <Input
          placeholder={running ? running.description || "Sin descripción" : "¿En qué estás trabajando?"}
          value={running ? (running.description ?? "") : description}
          onChange={(e) => !running && setDescription(e.target.value)}
          readOnly={!!running}
          className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
          onKeyDown={(e) => { if (e.key === "Enter" && !running) start(); }}
        />
        {running?.project && (
          <p className="text-xs text-muted-foreground mt-0.5">{running.project.name}</p>
        )}
      </div>

      <div className="font-mono text-lg font-bold tabular-nums min-w-[80px] text-right">
        {formatDuration(elapsed)}
      </div>

      {running ? (
        <Button size="icon" variant="destructive" className="h-9 w-9 shrink-0" onClick={stop}>
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={start}>
          <Play className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

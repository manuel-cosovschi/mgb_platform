"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, subWeeks, startOfWeek, format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(seconds: number) {
  if (!seconds) return "0h";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface Props {
  refreshKey?: number;
}

export function WeeklyView({ refreshKey }: Props) {
  const [weekAnchor, setWeekAnchor] = useState(new Date());

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries-week", weekStart.toISOString(), refreshKey],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries?week=${weekStart.toISOString()}&limit=200`);
      return res.json();
    },
  });

  // Group by day
  const byDay: Record<string, any[]> = {};
  days.forEach((d) => {
    byDay[format(d, "yyyy-MM-dd")] = [];
  });
  entries.forEach((e: any) => {
    const key = format(new Date(e.startTime), "yyyy-MM-dd");
    if (byDay[key]) byDay[key].push(e);
  });

  const totalSeconds = entries.reduce((sum: number, e: any) => sum + (e.duration ?? 0), 0);
  const billableSeconds = entries.filter((e: any) => e.isBillable).reduce((sum: number, e: any) => sum + (e.duration ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Vista semanal</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekAnchor(subWeeks(weekAnchor, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(weekStart, "d MMM", { locale: es })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWeekAnchor(new Date())}>
              Hoy
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Total: <strong className="text-foreground">{formatDuration(totalSeconds)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Facturable: <strong className="text-emerald-500">{formatDuration(billableSeconds)}</strong></span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEntries = byDay[key] ?? [];
            const daySeconds = dayEntries.reduce((s: number, e: any) => s + (e.duration ?? 0), 0);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={key} className={`rounded-lg border p-2 min-h-[120px] ${isToday ? "border-primary/50 bg-primary/5" : ""}`}>
                <div className="text-center mb-2">
                  <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE", { locale: es }).toUpperCase()}
                  </p>
                  <p className={`text-lg font-bold leading-none ${isToday ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </p>
                  {daySeconds > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(daySeconds)}</p>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="space-y-1">
                    {dayEntries.map((e: any) => (
                      <div
                        key={e.id}
                        className={`rounded px-1.5 py-1 text-[10px] leading-tight truncate ${e.isBillable ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                        title={`${e.description || "Sin descripción"} — ${formatDuration(e.duration ?? 0)}`}
                      >
                        <span className="font-medium">{formatDuration(e.duration ?? 0)}</span>
                        {e.description && <span className="ml-1 opacity-80 truncate block">{e.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

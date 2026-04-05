"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, addDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const eventTypeColors: Record<string, string> = {
  MEETING: "bg-blue-500/80",
  DEADLINE: "bg-red-500/80",
  SPRINT: "bg-purple-500/80",
  MILESTONE: "bg-yellow-500/80",
  HOLIDAY: "bg-green-500/80",
  OTHER: "bg-slate-500/80",
};

export default function CalendarPage() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "MEETING", startAt: "", endAt: "", isAllDay: false, location: "" });

  const monthKey = format(currentMonth, "yyyy-MM");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", monthKey],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/events?month=${monthKey}`);
      return res.json();
    },
  });

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay: Record<string, any[]> = {};
  events.forEach((e: any) => {
    const key = format(new Date(e.startAt), "yyyy-MM-dd");
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(e);
  });

  async function createEvent() {
    if (!form.title || !form.startAt) return;
    const endAt = form.endAt || form.startAt;
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, endAt }),
    });
    if (res.ok) {
      toast.success("Evento creado");
      setNewEventOpen(false);
      setForm({ title: "", type: "MEETING", startAt: "", endAt: "", isAllDay: false, location: "" });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  }

  const selectedDayEvents = selectedDay
    ? eventsByDay[format(selectedDay, "yyyy-MM-dd")] ?? []
    : [];

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Calendario" }]} />
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold capitalize min-w-[180px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
          </div>
          <Button onClick={() => setNewEventOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo evento
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
              {/* Day headers */}
              {dayNames.map((d) => (
                <div key={d} className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {/* Days */}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDay[key] ?? [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "bg-card min-h-[90px] p-1.5 cursor-pointer hover:bg-accent/30 transition-colors",
                      !isCurrentMonth && "opacity-40",
                      isSelected && "ring-2 ring-inset ring-primary"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 flex items-center justify-center rounded-full text-sm mb-1 mx-auto",
                      isToday && "bg-primary text-primary-foreground font-bold"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e: any) => (
                        <div
                          key={e.id}
                          className={cn(
                            "text-[10px] rounded px-1 py-0.5 text-white truncate",
                            eventTypeColors[e.type] ?? eventTypeColors.OTHER
                          )}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} más</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day detail sidebar */}
          <div className="w-64 shrink-0">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CalIcon className="h-4 w-4 text-primary" />
                {selectedDay
                  ? format(selectedDay, "d 'de' MMMM", { locale: es })
                  : "Seleccioná un día"}
              </h3>
              {selectedDay && (
                <div className="space-y-2">
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin eventos</p>
                  ) : (
                    selectedDayEvents.map((e: any) => (
                      <div key={e.id} className="rounded-md border p-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className={cn("h-2 w-2 rounded-full", eventTypeColors[e.type] ?? "bg-muted")} />
                          <p className="text-sm font-medium truncate">{e.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(e.startAt), "HH:mm")} — {format(new Date(e.endAt), "HH:mm")}
                        </p>
                        {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                        {e.attendees?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">{e.attendees.length} asistente(s)</p>
                        )}
                      </div>
                    ))
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setForm((f) => ({ ...f, startAt: format(selectedDay, "yyyy-MM-dd") + "T09:00" }));
                      setNewEventOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Evento este día
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New event dialog */}
        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nuevo evento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del evento" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="MEETING">Reunión</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="SPRINT">Sprint</option>
                  <option value="MILESTONE">Hito</option>
                  <option value="HOLIDAY">Feriado</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Inicio *</Label>
                  <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Lugar</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Google Meet, Oficina..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewEventOpen(false)}>Cancelar</Button>
              <Button onClick={createEvent} disabled={!form.title || !form.startAt}>Crear evento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

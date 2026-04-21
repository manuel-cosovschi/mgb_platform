"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, TypeBadge } from "@/components/side-projects/status-badge";
import { ScoreDisplay } from "@/components/side-projects/score-badge";
import { IdeaForm } from "@/components/side-projects/idea-form";
import { formatDate, formatRelativeTime, initials } from "@/lib/utils";
import {
  LayoutDashboard, ListTodo, Link2, Palette, DollarSign,
  KanbanSquare, FileText, Plus, Trash2, ExternalLink,
  ThumbsUp, Edit, Activity, Lightbulb, Target, Users,
  Clock, AlertTriangle, Zap, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SideProject {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  audience?: string | null;
  type: string;
  monetization?: string | null;
  status: string;
  score: number;
  complexity: number;
  revenuePotential: number;
  timeEstimate?: string | null;
  investment?: string | null;
  risk: string;
  synergy: number;
  stackSuggested?: string | null;
  observations?: string | null;
  brandName?: string | null;
  slogan?: string | null;
  brandColors?: string | null;
  logoUrl?: string | null;
  mrr?: number | null;
  cac?: number | null;
  roi?: number | null;
  totalRevenue?: number | null;
  totalCosts?: number | null;
  launchedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; image?: string | null };
  links: { id: string; type: string; label?: string | null; url: string }[];
  tasks: { id: string; title: string; status: string; priority: string; phase?: string | null; order: number }[];
  notes: { id: string; content: string; createdAt: string; author: { id: string; name: string; image?: string | null } }[];
  votes: { userId: string }[];
  activityLogs: { id: string; action: string; createdAt: string; user: { id: string; name: string; image?: string | null } }[];
  _count: { tasks: number; notes: number; votes: number };
}

interface Props {
  project: SideProject;
  userId: string;
  userRole: string;
}

const LINK_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  DRIVE:   { label: "Google Drive", icon: "📁", color: "text-blue-600" },
  NOTION:  { label: "Notion",       icon: "📝", color: "text-slate-600" },
  FIGMA:   { label: "Figma",        icon: "🎨", color: "text-pink-600" },
  GITHUB:  { label: "GitHub",       icon: "💻", color: "text-gray-700" },
  DOMAIN:  { label: "Dominio",      icon: "🌐", color: "text-green-600" },
  HOSTING: { label: "Hosting",      icon: "🖥️", color: "text-orange-600" },
  OTHER:   { label: "Otro",         icon: "🔗", color: "text-muted-foreground" },
};

const TASK_PHASES = ["MVP", "v2", "Backlog"];

export function SideProjectDetailClient({ project: initialProject, userId, userRole }: Props) {
  const [project, setProject] = useState<SideProject>(initialProject);
  const [showEditForm, setShowEditForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", phase: "MVP", priority: "MEDIUM" });
  const [addingTask, setAddingTask] = useState(false);
  const [newLink, setNewLink] = useState({ type: "GITHUB", url: "", label: "" });
  const [addingLink, setAddingLink] = useState(false);
  const [financeEdit, setFinanceEdit] = useState(false);
  const [financeValues, setFinanceValues] = useState({
    mrr: project.mrr ?? 0,
    cac: project.cac ?? 0,
    totalRevenue: project.totalRevenue ?? 0,
    totalCosts: project.totalCosts ?? 0,
  });

  const hasVoted = project.votes.some((v) => v.userId === userId);

  async function refreshProject() {
    const res = await fetch(`/api/side-projects/${project.id}`);
    if (res.ok) setProject(await res.json());
  }

  async function handleVote() {
    const res = await fetch(`/api/side-projects/${project.id}/vote`, { method: "POST" });
    const json = await res.json();
    toast.success(json.voted ? "Voto registrado" : "Voto removido");
    refreshProject();
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/side-projects/${project.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      if (!res.ok) throw new Error();
      setNoteText("");
      toast.success("Nota agregada");
      refreshProject();
    } catch {
      toast.error("Error al agregar nota");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleAddTask() {
    if (!newTask.title.trim()) return;
    setAddingTask(true);
    try {
      await fetch(`/api/side-projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      setNewTask({ title: "", phase: "MVP", priority: "MEDIUM" });
      toast.success("Tarea agregada");
      refreshProject();
    } catch {
      toast.error("Error al agregar tarea");
    } finally {
      setAddingTask(false);
    }
  }

  async function handleTaskStatus(taskId: string, status: string) {
    await fetch(`/api/side-projects/${project.id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refreshProject();
  }

  async function handleDeleteTask(taskId: string) {
    await fetch(`/api/side-projects/${project.id}/tasks/${taskId}`, { method: "DELETE" });
    toast.success("Tarea eliminada");
    refreshProject();
  }

  async function handleAddLink() {
    if (!newLink.url.trim()) return;
    setAddingLink(true);
    try {
      await fetch(`/api/side-projects/${project.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });
      setNewLink({ type: "GITHUB", url: "", label: "" });
      toast.success("Link agregado");
      refreshProject();
    } catch {
      toast.error("Error al agregar link");
    } finally {
      setAddingLink(false);
    }
  }

  async function handleDeleteLink(linkId: string) {
    await fetch(`/api/side-projects/${project.id}/links?linkId=${linkId}`, { method: "DELETE" });
    toast.success("Link eliminado");
    refreshProject();
  }

  async function handleSaveFinances() {
    const res = await fetch(`/api/side-projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(financeValues),
    });
    if (res.ok) {
      toast.success("Finanzas actualizadas");
      setFinanceEdit(false);
      refreshProject();
    }
  }

  const tasksByPhase = TASK_PHASES.map((phase) => ({
    phase,
    tasks: project.tasks.filter((t) => t.phase === phase || (!t.phase && phase === "MVP")),
  }));

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Project header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={project.status as Parameters<typeof StatusBadge>[0]["status"]} />
            <TypeBadge type={project.type as Parameters<typeof TypeBadge>[0]["type"]} />
            <Badge variant="outline" className="gap-1">
              <ThumbsUp className="h-3 w-3" /> {project._count.votes} votos
            </Badge>
          </div>
          <h1 className="text-2xl font-bold mt-1">{project.title}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.owner.image ?? undefined} />
              <AvatarFallback className="text-xs">{initials(project.owner.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{project.owner.name}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">Creado {formatDate(project.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className={cn("gap-2", hasVoted && "text-primary border-primary")} onClick={handleVote}>
            <ThumbsUp className="h-4 w-4" />
            {hasVoted ? "Votado" : "Votar"}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowEditForm(true)}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Score banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <ScoreDisplay
            score={project.score}
            className="gap-4"
          />
        </CardContent>
      </Card>

      {/* Smart suggestions */}
      <SmartSuggestions project={project} />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <LayoutDashboard className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="planning" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" /> Planificación
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-xs">
            <Link2 className="h-3.5 w-3.5" /> Recursos
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" /> Branding
          </TabsTrigger>
          <TabsTrigger value="finances" className="gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5" /> Finanzas
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs">
            <KanbanSquare className="h-3.5 w-3.5" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Notas
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" /> Actividad
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard icon={Lightbulb} label="Problema" value={project.problem} />
            <InfoCard icon={Target} label="Solución" value={project.solution} />
            <InfoCard icon={Users} label="Público objetivo" value={project.audience} />
            <InfoCard icon={DollarSign} label="Monetización" value={project.monetization} />
            <InfoCard icon={Clock} label="Tiempo estimado" value={project.timeEstimate} />
            <InfoCard icon={AlertTriangle} label="Inversión inicial" value={project.investment} />
            <InfoCard icon={Zap} label="Stack sugerido" value={project.stackSuggested} />
            <InfoCard label="Riesgo" value={project.risk === "LOW" ? "🟢 Bajo" : project.risk === "MEDIUM" ? "🟡 Medio" : "🔴 Alto"} />
            {project.launchedAt && <InfoCard label="Fecha de lanzamiento" value={formatDate(project.launchedAt)} />}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Potencial ingresos" value={project.revenuePotential} max={10} />
            <MetricCard label="Complejidad" value={project.complexity} max={10} inverted />
            <MetricCard label="Sinergia" value={project.synergy} max={10} />
          </div>

          {project.observations && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Observaciones</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{project.observations}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PLANNING */}
        <TabsContent value="planning" className="space-y-4 mt-4">
          {/* Add task form */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Agregar tarea</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Input
                  className="flex-1 min-w-40"
                  placeholder="Título de la tarea..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                />
                <Select value={newTask.phase} onValueChange={(v) => setNewTask({ ...newTask, phase: v })}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTask} disabled={addingTask} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {tasksByPhase.map(({ phase, tasks }) => (
            <Card key={phase}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {phase}
                  <Badge variant="secondary">{tasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Select value={task.status} onValueChange={(v) => handleTaskStatus(task.id, v)}>
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">Por hacer</SelectItem>
                        <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                        <SelectItem value="DONE">Hecho</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className={cn("flex-1 text-sm", task.status === "DONE" && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {task.priority === "HIGH" ? "🔴" : task.priority === "MEDIUM" ? "🟡" : "🟢"} {task.priority}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin tareas en {phase}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RESOURCES */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Agregar link</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Select value={newLink.type} onValueChange={(v) => setNewLink({ ...newLink, type: v })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LINK_TYPE_CONFIG).map(([val, { label, icon }]) => (
                      <SelectItem key={val} value={val}>{icon} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1 min-w-40"
                  placeholder="https://..."
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                />
                <Input
                  className="w-32"
                  placeholder="Etiqueta (opcional)"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                />
                <Button onClick={handleAddLink} disabled={addingLink} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.links.map((link) => {
              const config = LINK_TYPE_CONFIG[link.type] ?? LINK_TYPE_CONFIG.OTHER;
              return (
                <Card key={link.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                      <p className="text-sm font-medium truncate">{link.label || link.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteLink(link.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {project.links.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Sin links todavía</p>
            )}
          </div>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <BrandingTab project={project} onSave={refreshProject} />
        </TabsContent>

        {/* FINANCES */}
        <TabsContent value="finances" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Métricas financieras</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setFinanceEdit(!financeEdit)}>
                {financeEdit ? "Cancelar" : <><Edit className="h-4 w-4 mr-1" /> Editar</>}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "totalRevenue", label: "Revenue total (USD)", icon: "💰" },
                  { key: "totalCosts",   label: "Costos totales (USD)", icon: "💸" },
                  { key: "mrr",          label: "MRR (USD)",            icon: "📈" },
                  { key: "cac",          label: "CAC (USD)",            icon: "🎯" },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{icon} {label}</Label>
                    {financeEdit ? (
                      <Input
                        type="number"
                        value={financeValues[key as keyof typeof financeValues]}
                        onChange={(e) => setFinanceValues({ ...financeValues, [key]: parseFloat(e.target.value) || 0 })}
                      />
                    ) : (
                      <p className="text-lg font-semibold">
                        ${(project[key as keyof SideProject] as number ?? 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {project.totalRevenue && project.totalCosts ? (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">ROI estimado</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {Math.round(((project.totalRevenue - project.totalCosts) / project.totalCosts) * 100)}%
                  </p>
                </div>
              ) : null}

              {financeEdit && (
                <Button onClick={handleSaveFinances} className="w-full">Guardar finanzas</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TASKS KANBAN */}
        <TabsContent value="tasks" className="mt-4">
          <MiniKanban
            tasks={project.tasks}
            projectId={project.id}
            onRefresh={refreshProject}
          />
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Escribí una nota..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddNote} disabled={addingNote || !noteText.trim()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {addingNote ? "Guardando..." : "Agregar nota"}
            </Button>
          </div>
          <Separator />
          <div className="space-y-3">
            {project.notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={note.author.image ?? undefined} />
                      <AvatarFallback className="text-[9px]">{initials(note.author.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{note.author.name}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(note.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
            {project.notes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin notas todavía</p>
            )}
          </div>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <div className="space-y-3">
            {project.activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <Avatar className="h-6 w-6 mt-0.5">
                  <AvatarImage src={log.user.image ?? undefined} />
                  <AvatarFallback className="text-[9px]">{initials(log.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{log.user.name}</span>{" "}
                    <span className="text-muted-foreground">{translateAction(log.action)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
            {project.activityLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin actividad registrada</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <IdeaForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={() => { setShowEditForm(false); refreshProject(); }}
        defaultValues={{ ...project, id: project.id } as Parameters<typeof IdeaForm>[0]["defaultValues"]}
      />
    </div>
  );
}

function translateAction(action: string): string {
  const map: Record<string, string> = {
    CREATED: "creó esta idea",
    UPDATED: "actualizó la idea",
    STATUS_CHANGED: "cambió el estado",
    VOTED: "votó por esta idea",
  };
  return map[action] ?? action.toLowerCase();
}

function InfoCard({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, max, inverted }: { label: string; value: number; max: number; inverted?: boolean }) {
  const display = inverted ? max - value : value;
  const pct = (value / max) * 100;
  const displayPct = inverted ? 100 - pct : pct;
  const color = displayPct >= 70 ? "bg-emerald-500" : displayPct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold">{inverted ? max - value : value}<span className="text-sm text-muted-foreground">/{max}</span></p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${displayPct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function BrandingTab({ project, onSave }: { project: SideProject; onSave: () => void }) {
  const [values, setValues] = useState({
    brandName: project.brandName ?? "",
    slogan: project.slogan ?? "",
    brandColors: project.brandColors ?? "",
    logoUrl: project.logoUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/side-projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) { toast.success("Branding guardado"); onSave(); }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Identidad de marca</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Nombre comercial</Label>
            <Input placeholder="Ej: BarberPro" value={values.brandName} onChange={(e) => setValues({ ...values, brandName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Slogan</Label>
            <Input placeholder="Ej: Tu barbería siempre llena" value={values.slogan} onChange={(e) => setValues({ ...values, slogan: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Paleta de colores</Label>
            <Input placeholder="Ej: #6366f1, #0f172a" value={values.brandColors} onChange={(e) => setValues({ ...values, brandColors: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>URL del logo</Label>
            <Input placeholder="https://..." value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} />
          </div>
        </div>
        {values.brandColors && (
          <div className="flex gap-2">
            {values.brandColors.split(",").map((c) => (
              <div key={c} className="h-8 w-8 rounded-full border" style={{ backgroundColor: c.trim() }} title={c.trim()} />
            ))}
          </div>
        )}
        <Button onClick={save} disabled={saving} size="sm">{saving ? "Guardando..." : "Guardar branding"}</Button>
      </CardContent>
    </Card>
  );
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  phase?: string | null;
  order: number;
}

function MiniKanban({ tasks, projectId, onRefresh }: { tasks: Task[]; projectId: string; onRefresh: () => void }) {
  const columns = [
    { id: "TODO", label: "Por hacer", color: "border-slate-300" },
    { id: "IN_PROGRESS", label: "En progreso", color: "border-blue-300" },
    { id: "DONE", label: "Hecho", color: "border-emerald-300" },
  ];

  async function move(taskId: string, status: string) {
    await fetch(`/api/side-projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className={cn("rounded-xl border-2 p-3 min-h-[200px]", col.color)}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-sm">{col.label}</span>
              <Badge variant="secondary" className="h-5 text-xs">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((task) => (
                <div key={task.id} className="bg-card border rounded-lg p-2.5 group">
                  <p className="text-sm font-medium leading-snug">{task.title}</p>
                  <div className="flex gap-1 mt-2">
                    {col.id !== "TODO" && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => move(task.id, "TODO")}>← Volver</Button>
                    )}
                    {col.id !== "DONE" && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => move(task.id, col.id === "TODO" ? "IN_PROGRESS" : "DONE")}>
                        {col.id === "TODO" ? "Iniciar →" : "Terminar ✓"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Vacío</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmartSuggestions({ project }: { project: SideProject }) {
  const suggestions: string[] = [];

  if (project.score >= 75 && project.status === "IDEA") {
    suggestions.push("🔥 Recomendación: construir ahora — score excelente");
  }
  if (project.complexity <= 3 && project.status !== "IN_DEVELOPMENT") {
    suggestions.push(`⚡ Tiempo estimado para MVP: ${project.timeEstimate ?? "~1 mes"}`);
  }
  if (project.synergy >= 8) {
    suggestions.push("🤝 Podría venderse a clientes actuales de la agencia");
  }
  if (project.type === "SAAS") {
    suggestions.push("💡 Esta idea se parece a modelos exitosos como Calendly o Notion");
  }
  if (project.risk === "LOW" && project.revenuePotential >= 7) {
    suggestions.push("✅ Bajo riesgo + alto potencial — candidata ideal para priorizar");
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <div key={s} className="text-xs bg-primary/5 border border-primary/20 text-primary rounded-full px-3 py-1">
          {s}
        </div>
      ))}
    </div>
  );
}

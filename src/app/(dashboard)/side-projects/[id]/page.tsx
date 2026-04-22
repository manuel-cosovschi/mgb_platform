"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Heart, Plus, Trash2, ExternalLink, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay, ScoreBadge } from "@/components/side-projects/score-display";
import { StatusBadge, TypeBadge, PriorityBadge } from "@/components/side-projects/badges";
import { getSmartSuggestions } from "@/lib/side-projects/score-engine";
import { toast } from "sonner";

export default function SideProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/side-projects/${id}`);
      if (res.ok) setProject(await res.json());
      else router.push("/side-projects");
    } catch { router.push("/side-projects"); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleVote = async () => {
    await fetch(`/api/side-projects/${id}/vote`, { method: "POST" });
    fetchProject();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const res = await fetch(`/api/side-projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask }),
    });
    if (res.ok) { setNewTask(""); fetchProject(); toast.success("Tarea agregada"); }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/side-projects/${id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchProject();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/side-projects/${id}/tasks/${taskId}`, { method: "DELETE" });
    fetchProject();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const res = await fetch(`/api/side-projects/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    if (res.ok) { setNewNote(""); fetchProject(); toast.success("Nota agregada"); }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim()) return;
    const res = await fetch(`/api/side-projects/${id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newLinkUrl, title: newLinkTitle }),
    });
    if (res.ok) { setNewLinkUrl(""); setNewLinkTitle(""); fetchProject(); toast.success("Link agregado"); }
  };

  if (loading) return <div className="p-6"><div className="h-64 skeleton rounded-xl" /></div>;
  if (!project) return null;

  const p = project as Record<string, unknown>;
  const tasks = (p.tasks as Array<Record<string, unknown>>) ?? [];
  const notes = (p.notes as Array<Record<string, unknown>>) ?? [];
  const links = (p.links as Array<Record<string, unknown>>) ?? [];
  const activities = (p.activities as Array<Record<string, unknown>>) ?? [];
  const votes = (p.votes as Array<Record<string, unknown>>) ?? [];
  const hasVoted = votes.some((v) => v.userId === session?.user?.id);
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;

  const suggestions = getSmartSuggestions({
    revenueScore: p.revenueScore as number,
    easeScore: p.easeScore as number,
    synergyScore: p.synergyScore as number,
    speedScore: p.speedScore as number,
    riskScore: p.riskScore as number,
    totalScore: p.totalScore as number,
    complexity: p.complexity as string,
    type: p.type as string,
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
          <Link href="/side-projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl">{p.emoji as string || "💡"}</span>
            <h1 className="text-2xl font-bold truncate">{p.title as string}</h1>
            <ScoreBadge score={p.totalScore as number} size="lg" />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={p.status as string} />
            <TypeBadge type={p.type as string} />
            <PriorityBadge priority={p.priority as string} />
            <Button variant="ghost" size="sm" className={`gap-1 ${hasVoted ? "text-pink-500" : ""}`} onClick={handleVote}>
              <Heart className={`h-4 w-4 ${hasVoted ? "fill-pink-500" : ""}`} />
              {votes.length}
            </Button>
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">💡 Smart Suggestions</p>
            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">{s}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="notes">Notas ({notes.length})</TabsTrigger>
          <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Descripción</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{p.description as string || "Sin descripción"}</p>
                {p.problem && (
                  <div><strong>Problema:</strong> <span className="text-muted-foreground">{p.problem as string}</span></div>
                )}
                {p.solution && (
                  <div><strong>Solución:</strong> <span className="text-muted-foreground">{p.solution as string}</span></div>
                )}
                {p.targetAudience && (
                  <div><strong>Audiencia:</strong> <span className="text-muted-foreground">{p.targetAudience as string}</span></div>
                )}
                {(p.tags as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(p.tags as string[]).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                )}
                {(p.techStack as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(p.techStack as string[]).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ScoreDisplay
                  revenueScore={p.revenueScore as number}
                  easeScore={p.easeScore as number}
                  synergyScore={p.synergyScore as number}
                  speedScore={p.speedScore as number}
                  riskScore={p.riskScore as number}
                  totalScore={p.totalScore as number}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Tasks — {doneTasks}/{tasks.length} completadas</CardTitle>
              </div>
              <div className="flex gap-2">
                <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nueva tarea..." onKeyDown={(e) => e.key === "Enter" && addTask()} />
                <Button size="sm" onClick={addTask}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {tasks.map((task) => (
                <div key={task.id as string} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                  <button onClick={() => toggleTask(task.id as string, task.status as string)}>
                    {task.status === "DONE" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title as string}</span>
                  <button onClick={() => deleteTask(task.id as string)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notas</CardTitle>
              <div className="space-y-2">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escribir nota..." rows={3} />
                <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Agregar nota</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note) => (
                <div key={note.id as string} className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{note.content as string}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(note.createdAt as string).toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Links y Recursos</CardTitle>
              <div className="flex gap-2">
                <Input value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} placeholder="Título..." className="w-40" />
                <Input value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} placeholder="URL..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && addLink()} />
                <Button size="sm" onClick={addLink}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {links.map((link) => (
                <div key={link.id as string} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={link.url as string} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                    {(link.title as string) || (link.url as string)}
                  </a>
                  {link.type && <Badge variant="outline" className="text-xs shrink-0">{link.type as string}</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="text-sm">Actividad reciente</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activities.map((act) => (
                <div key={act.id as string} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{act.action as string}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(act.createdAt as string).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

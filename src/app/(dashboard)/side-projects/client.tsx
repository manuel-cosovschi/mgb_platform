"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SideProjectsKpis } from "@/components/side-projects/side-projects-kpis";
import { BrainstormingBoard } from "@/components/side-projects/brainstorming-board";
import { PipelineView } from "@/components/side-projects/pipeline-view";
import { IdeaCard } from "@/components/side-projects/idea-card";
import { IdeaForm } from "@/components/side-projects/idea-form";
import { AIGenerator } from "@/components/side-projects/ai-generator";
import { IdeaComparator } from "@/components/side-projects/idea-comparator";
import { ScoreBadge } from "@/components/side-projects/score-badge";
import { StatusBadge } from "@/components/side-projects/status-badge";
import { formatRelativeTime, initials } from "@/lib/utils";
import {
  Plus, Search, Sparkles, GitCompare, Columns,
  List, GitBranch, BarChart2, Trophy, Clock, Zap,
} from "lucide-react";

interface SideProjectsClientProps {
  userId: string;
  userRole: string;
}

export function SideProjectsClient({ userId, userRole }: SideProjectsClientProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDefaults, setFormDefaults] = useState<Record<string, unknown>>({});

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (typeFilter !== "all") params.set("type", typeFilter);
  if (search) params.set("search", search);
  params.set("orderBy", "score");
  params.set("order", "desc");

  const { data, isLoading } = useQuery({
    queryKey: ["side-projects", statusFilter, typeFilter, search],
    queryFn: async () => {
      const res = await fetch(`/api/side-projects?${params}`);
      return res.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["side-projects-stats"],
    queryFn: async () => {
      const res = await fetch("/api/side-projects/stats");
      return res.json();
    },
  });

  const projects = data?.data ?? [];

  function refresh() {
    qc.invalidateQueries({ queryKey: ["side-projects"] });
    qc.invalidateQueries({ queryKey: ["side-projects-stats"] });
  }

  async function handleVote(id: string) {
    try {
      const res = await fetch(`/api/side-projects/${id}/vote`, { method: "POST" });
      const json = await res.json();
      toast.success(json.voted ? "Voto registrado" : "Voto removido");
      refresh();
    } catch {
      toast.error("Error al votar");
    }
  }

  function handleEdit(id: string) {
    const project = projects.find((p: { id: string }) => p.id === id);
    if (project) {
      setFormDefaults({ ...project, id });
      setEditingId(id);
      setShowForm(true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Archivar esta idea?")) return;
    try {
      await fetch(`/api/side-projects/${id}`, { method: "DELETE" });
      toast.success("Idea archivada");
      refresh();
    } catch {
      toast.error("Error al archivar");
    }
  }

  function handleNew(status?: string) {
    setFormDefaults(status ? { status } : {});
    setEditingId(null);
    setShowForm(true);
  }

  function handleAISelect(idea: Record<string, unknown>) {
    setFormDefaults({
      title: idea.title,
      description: idea.description,
      type: idea.type,
      revenuePotential: idea.revenuePotential,
      complexity: idea.complexity,
      risk: idea.risk,
      synergy: idea.synergy,
      timeEstimate: idea.timeEstimate,
    });
    setEditingId(null);
    setShowForm(true);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            🚀 Side Projects Lab
          </h2>
          <p className="text-sm text-muted-foreground">
            Brainstorming, priorización y gestión de proyectos propios
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowComparator(true)}>
            <GitCompare className="h-4 w-4" />
            Comparar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAI(true)}>
            <Sparkles className="h-4 w-4" />
            Generar ideas
          </Button>
          <Button size="sm" className="gap-2" onClick={() => handleNew()}>
            <Plus className="h-4 w-4" />
            Nueva idea
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <SideProjectsKpis />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ideas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="IDEA">Idea nueva</SelectItem>
            <SelectItem value="EVALUATING">Evaluando</SelectItem>
            <SelectItem value="VALIDATING">Validando</SelectItem>
            <SelectItem value="PRIORITIZED">Priorizada</SelectItem>
            <SelectItem value="IN_DEVELOPMENT">En desarrollo</SelectItem>
            <SelectItem value="LAUNCHED">Lanzada</SelectItem>
            <SelectItem value="ARCHIVED">Archivada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="SAAS">☁️ SaaS</SelectItem>
            <SelectItem value="MARKETPLACE">🛒 Marketplace</SelectItem>
            <SelectItem value="TOOL">🔧 Tool</SelectItem>
            <SelectItem value="AI">🤖 IA</SelectItem>
            <SelectItem value="ECOMMERCE">🏪 E-commerce</SelectItem>
            <SelectItem value="APP">📱 App</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="board">
        <TabsList className="mb-4">
          <TabsTrigger value="board" className="gap-2">
            <Columns className="h-4 w-4" />
            Brainstorming
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* KANBAN BOARD */}
        <TabsContent value="board">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Cargando ideas...</div>
          ) : projects.length === 0 ? (
            <EmptyState onNew={() => handleNew()} onAI={() => setShowAI(true)} />
          ) : (
            <BrainstormingBoard
              projects={projects}
              currentUserId={userId}
              onVote={handleVote}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNew={handleNew}
              onStatusChange={refresh}
            />
          )}
        </TabsContent>

        {/* LIST VIEW */}
        <TabsContent value="list">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: Parameters<typeof IdeaCard>[0]["project"]) => (
                <IdeaCard
                  key={project.id}
                  project={project}
                  currentUserId={userId}
                  onVote={handleVote}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {projects.length === 0 && <EmptyState onNew={() => handleNew()} onAI={() => setShowAI(true)} />}
            </div>
          )}
        </TabsContent>

        {/* PIPELINE */}
        <TabsContent value="pipeline">
          <PipelineView projects={projects} onReorder={refresh} />
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <ReportsTab projects={projects} stats={statsData} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IdeaForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); setFormDefaults({}); }}
        onSuccess={refresh}
        defaultValues={editingId ? { ...formDefaults as Record<string, unknown>, id: editingId } as Parameters<typeof IdeaForm>[0]["defaultValues"] : formDefaults as Parameters<typeof IdeaForm>[0]["defaultValues"]}
      />

      <AIGenerator
        open={showAI}
        onClose={() => setShowAI(false)}
        onSelectIdea={(idea) => handleAISelect(idea as unknown as Record<string, unknown>)}
      />

      <IdeaComparator
        open={showComparator}
        onClose={() => setShowComparator(false)}
        projects={projects}
      />
    </div>
  );
}

function EmptyState({ onNew, onAI }: { onNew: () => void; onAI: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h3 className="font-semibold text-lg mb-2">¡Empezá tu primer side project!</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        Documentá tus ideas, calculá su potencial y priorizá cuál construir primero.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={onAI}>
          <Sparkles className="h-4 w-4" /> Generar ideas con IA
        </Button>
        <Button className="gap-2" onClick={onNew}>
          <Plus className="h-4 w-4" /> Nueva idea
        </Button>
      </div>
    </div>
  );
}

interface ReportProject {
  id: string;
  title: string;
  status: string;
  type: string;
  score: number;
  complexity: number;
  revenuePotential: number;
  synergy: number;
  risk: string;
  timeEstimate?: string | null;
  totalRevenue?: number | null;
  createdAt: string | Date;
  owner: { id: string; name: string; image?: string | null };
  votes: { userId: string }[];
}

function ReportsTab({ projects, stats }: { projects: ReportProject[]; stats: Record<string, unknown> | null }) {
  const top5 = [...projects].sort((a, b) => b.score - a.score).slice(0, 5);
  const launched = projects.filter((p) => p.status === "LAUNCHED");
  const discarded = projects.filter((p) => p.status === "ARCHIVED");
  const totalProjects = projects.filter((p) => p.status !== "ARCHIVED").length;
  const executionRate = totalProjects > 0 ? Math.round((launched.length / totalProjects) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 5 ideas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 5 ideas por score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {top5.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <StatusBadge status={p.status as Parameters<typeof StatusBadge>[0]["status"]} />
              </div>
              <ScoreBadge
                input={{ revenuePotential: p.revenuePotential, complexity: p.complexity, synergy: p.synergy, risk: p.risk as "LOW"|"MEDIUM"|"HIGH", timeEstimate: p.timeEstimate }}
                size="sm"
              />
            </div>
          ))}
          {top5.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin ideas aún</p>}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{executionRate}%</p>
                <p className="text-sm text-muted-foreground">Tasa de ejecución</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Proyectos lanzados ({launched.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {launched.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm">{p.title}</span>
                {p.totalRevenue && (
                  <Badge variant="outline" className="text-emerald-600">
                    ${p.totalRevenue.toLocaleString()}
                  </Badge>
                )}
              </div>
            ))}
            {launched.length === 0 && <p className="text-xs text-muted-foreground">Sin proyectos lanzados aún</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ideas descartadas ({discarded.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {discarded.slice(0, 5).map((p) => (
              <p key={p.id} className="text-sm text-muted-foreground">{p.title}</p>
            ))}
            {discarded.length === 0 && <p className="text-xs text-muted-foreground">Ninguna descartada</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCard } from "@/components/side-projects/idea-card";
import { IdeaForm } from "@/components/side-projects/idea-form";
import { BrainstormingBoard } from "@/components/side-projects/brainstorming-board";
import { PipelineView } from "@/components/side-projects/pipeline-view";
import { AIGenerator } from "@/components/side-projects/ai-generator";
import { IdeaComparator } from "@/components/side-projects/idea-comparator";
import { SideProjectsKpis } from "@/components/side-projects/kpis";
import { toast } from "sonner";

type SideProjectData = {
  id: string; title: string; slug: string; description?: string | null;
  emoji?: string | null; status: string; type: string; priority: string;
  complexity: string; totalScore: number; tags: string[];
  revenueScore: number; easeScore: number; synergyScore: number;
  speedScore: number; riskScore: number; pipelineOrder?: number;
  votes?: { userId: string }[];
  _count?: { votes: number; tasks: number; notes: number };
  createdBy?: { name: string; image?: string | null };
};

export default function SideProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<SideProjectData[]>([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/side-projects?${params}`);
      const data = await res.json();
      setProjects(data.data ?? []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/side-projects/stats");
      const data = await res.json();
      setStats(data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchProjects(); fetchStats(); }, [fetchProjects, fetchStats]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const isEdit = !!editData?.id;
      const url = isEdit ? `/api/side-projects/${editData.id}` : "/api/side-projects";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(isEdit ? "Idea actualizada" : "Idea creada");
        setFormOpen(false);
        setEditData(null);
        fetchProjects();
        fetchStats();
      } else {
        toast.error("Error al guardar");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const handleVote = async (id: string) => {
    try {
      await fetch(`/api/side-projects/${id}/vote`, { method: "POST" });
      fetchProjects();
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta idea?")) return;
    try {
      await fetch(`/api/side-projects/${id}`, { method: "DELETE" });
      toast.success("Idea eliminada");
      fetchProjects();
      fetchStats();
    } catch { toast.error("Error al eliminar"); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/side-projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProjects();
    } catch { /* empty */ }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    try {
      await fetch(`/api/side-projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchProjects();
    } catch { /* empty */ }
  };

  const handleAddGeneratedIdea = async (idea: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/side-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idea),
      });
      if (res.ok) {
        toast.success("Idea agregada desde IA");
        fetchProjects();
        fetchStats();
      }
    } catch { toast.error("Error al agregar"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Side Projects Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Brainstorming, evaluación y pipeline de ideas de negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ideas..."
              className="pl-8 w-56"
            />
          </div>
          <Button onClick={() => { setEditData(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva idea
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <SideProjectsKpis stats={stats} loading={loading} />

      {/* Tabs */}
      <Tabs defaultValue="brainstorming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brainstorming">🧠 Brainstorming</TabsTrigger>
          <TabsTrigger value="list">📋 Lista</TabsTrigger>
          <TabsTrigger value="pipeline">🔄 Pipeline</TabsTrigger>
          <TabsTrigger value="compare">⚖️ Comparar</TabsTrigger>
          <TabsTrigger value="ai">🤖 IA Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="brainstorming">
          <BrainstormingBoard
            projects={projects}
            currentUserId={session?.user?.id}
            onVote={handleVote}
            onEdit={(p) => { setEditData(p as unknown as Record<string, unknown>); setFormOpen(true); }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="list">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl skeleton" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No hay ideas todavía</p>
              <p className="text-sm">Creá tu primera idea o usá el generador IA</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((p) => (
                <IdeaCard
                  key={p.id}
                  project={p}
                  currentUserId={session?.user?.id}
                  onVote={handleVote}
                  onEdit={(proj) => { setEditData(proj as unknown as Record<string, unknown>); setFormOpen(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineView
            projects={projects}
            currentUserId={session?.user?.id}
            onVote={handleVote}
            onEdit={(p) => { setEditData(p as unknown as Record<string, unknown>); setFormOpen(true); }}
            onDelete={handleDelete}
            onPriorityChange={handlePriorityChange}
          />
        </TabsContent>

        <TabsContent value="compare">
          <IdeaComparator projects={projects} />
        </TabsContent>

        <TabsContent value="ai">
          <AIGenerator onAddIdea={handleAddGeneratedIdea as (idea: Record<string, unknown>) => void} />
        </TabsContent>
      </Tabs>

      {/* Form modal */}
      <IdeaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editData}
        isLoading={submitting}
      />
    </div>
  );
}

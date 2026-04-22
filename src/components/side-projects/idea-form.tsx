"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreDisplay } from "./score-display";
import { calculateScore } from "@/lib/side-projects/score-engine";

interface IdeaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

const defaultForm = {
  title: "",
  description: "",
  problem: "",
  solution: "",
  targetAudience: "",
  type: "SAAS",
  status: "IDEA",
  priority: "P4_MAYBE",
  complexity: "MODERATE",
  revenueScore: 5,
  easeScore: 5,
  synergyScore: 5,
  speedScore: 5,
  riskScore: 5,
  emoji: "💡",
  color: "#6366f1",
  tags: [] as string[],
  techStack: [] as string[],
  estimatedHours: "",
  monthlyRevenue: "",
};

export function IdeaForm({ open, onOpenChange, onSubmit, initialData, isLoading }: IdeaFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [tagInput, setTagInput] = useState("");
  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        ...defaultForm,
        ...Object.fromEntries(
          Object.entries(initialData).map(([k, v]) => [k, v ?? defaultForm[k as keyof typeof defaultForm]])
        ),
      } as typeof defaultForm);
    } else {
      setForm(defaultForm);
    }
  }, [initialData, open]);

  const score = calculateScore({
    revenueScore: form.revenueScore,
    easeScore: form.easeScore,
    synergyScore: form.synergyScore,
    speedScore: form.speedScore,
    riskScore: form.riskScore,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      monthlyRevenue: form.monthlyRevenue ? Number(form.monthlyRevenue) : undefined,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const addTech = () => {
    if (techInput.trim() && !form.techStack.includes(techInput.trim())) {
      setForm({ ...form, techStack: [...form.techStack, techInput.trim()] });
      setTechInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Idea" : "Nueva Idea"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modifica los detalles de tu side project." : "Agrega una nueva idea al lab de side projects."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sp-title">Título</Label>
              <div className="flex gap-2">
                <Input
                  id="sp-emoji"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="w-14 text-center text-lg"
                  maxLength={4}
                />
                <Input
                  id="sp-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nombre del side project..."
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sp-desc">Descripción</Label>
              <Textarea
                id="sp-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="¿De qué se trata?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-problem">Problema</Label>
              <Textarea
                id="sp-problem"
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                placeholder="¿Qué problema resuelve?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-solution">Solución</Label>
              <Textarea
                id="sp-solution"
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
                placeholder="¿Cómo lo resuelve?"
                rows={2}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAAS">☁️ SaaS</SelectItem>
                  <SelectItem value="MARKETPLACE">🏪 Marketplace</SelectItem>
                  <SelectItem value="AGENCY_SERVICE">🤝 Servicio</SelectItem>
                  <SelectItem value="TEMPLATE">📋 Template</SelectItem>
                  <SelectItem value="TOOL">🔧 Tool</SelectItem>
                  <SelectItem value="CONTENT">📝 Content</SelectItem>
                  <SelectItem value="PHYSICAL">📦 Físico</SelectItem>
                  <SelectItem value="OTHER">📌 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDEA">💡 Idea</SelectItem>
                  <SelectItem value="EVALUATING">🔍 Evaluando</SelectItem>
                  <SelectItem value="APPROVED">✅ Aprobada</SelectItem>
                  <SelectItem value="IN_DEVELOPMENT">🛠️ En desarrollo</SelectItem>
                  <SelectItem value="MVP_READY">🚀 MVP Listo</SelectItem>
                  <SelectItem value="LAUNCHED">🎯 Lanzado</SelectItem>
                  <SelectItem value="PAUSED">⏸️ Pausado</SelectItem>
                  <SelectItem value="DISCARDED">❌ Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1_NOW">🔴 P1 — Ahora</SelectItem>
                  <SelectItem value="P2_NEXT">🟡 P2 — Siguiente</SelectItem>
                  <SelectItem value="P3_LATER">🔵 P3 — Después</SelectItem>
                  <SelectItem value="P4_MAYBE">⚪ P4 — Quizás</SelectItem>
                  <SelectItem value="P5_SOMEDAY">💤 P5 — Algún día</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Complejidad</Label>
              <Select value={form.complexity} onValueChange={(v) => setForm({ ...form, complexity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIVIAL">Trivial</SelectItem>
                  <SelectItem value="SIMPLE">Simple</SelectItem>
                  <SelectItem value="MODERATE">Moderada</SelectItem>
                  <SelectItem value="COMPLEX">Compleja</SelectItem>
                  <SelectItem value="MASSIVE">Masiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Score sliders */}
          <div className="border rounded-xl p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-3">Score en tiempo real</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {[
                  { key: "revenueScore", label: "💰 Revenue potencial" },
                  { key: "easeScore", label: "🎯 Facilidad de ejecución" },
                  { key: "synergyScore", label: "🤝 Sinergia con el negocio" },
                  { key: "speedScore", label: "⚡ Velocidad al mercado" },
                  { key: "riskScore", label: "🛡️ Bajo riesgo (↑ = mejor)" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{label}</Label>
                      <span className="text-xs font-mono font-semibold">
                        {form[key as keyof typeof form] as number}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form[key as keyof typeof form] as number}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                      className="w-full accent-primary h-1.5"
                    />
                  </div>
                ))}
              </div>
              <ScoreDisplay
                revenueScore={form.revenueScore}
                easeScore={form.easeScore}
                synergyScore={form.synergyScore}
                speedScore={form.speedScore}
                riskScore={form.riskScore}
                totalScore={score.total}
              />
            </div>
          </div>

          {/* Tags & Tech Stack */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Agregar tag..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                    #{tag}
                    <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })} className="text-muted-foreground hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                  placeholder="Agregar tecnología..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTech}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.techStack.map((tech) => (
                  <span key={tech} className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs">
                    {tech}
                    <button type="button" onClick={() => setForm({ ...form, techStack: form.techStack.filter((t) => t !== tech) })} className="hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sp-audience">Audiencia objetivo</Label>
              <Input
                id="sp-audience"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="¿A quién va dirigido?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-hours">Horas estimadas</Label>
              <Input
                id="sp-hours"
                type="number"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-revenue">Revenue mensual (USD)</Label>
              <Input
                id="sp-revenue"
                type="number"
                value={form.monthlyRevenue}
                onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !form.title.trim()}>
              {isLoading ? "Guardando..." : initialData ? "Guardar cambios" : "Crear idea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

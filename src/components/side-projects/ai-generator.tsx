"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./score-badge";
import { TypeBadge } from "./status-badge";
import { Sparkles, Plus, RefreshCw } from "lucide-react";
import { calculateScore } from "@/lib/side-projects/score-engine";

interface GeneratedIdea {
  title: string;
  description: string;
  type: string;
  revenuePotential: number;
  complexity: number;
  risk: string;
  synergy: number;
  timeEstimate: string;
}

interface AIGeneratorProps {
  open: boolean;
  onClose: () => void;
  onSelectIdea: (idea: GeneratedIdea) => void;
}

export function AIGenerator({ open, onClose, onSelectIdea }: AIGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const form = useForm({ defaultValues: { niche: "", problem: "", market: "", budget: "", skills: "" } });

  async function onSubmit(values: Record<string, string>) {
    setLoading(true);
    try {
      const res = await fetch("/api/side-projects/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      toast.error("Error al generar ideas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de ideas
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nicho</Label>
              <Input placeholder="Ej: gastronomía, fitness, salud" {...form.register("niche")} />
            </div>
            <div className="space-y-1">
              <Label>Mercado objetivo</Label>
              <Input placeholder="Ej: PYMEs argentinas" {...form.register("market")} />
            </div>
            <div className="space-y-1">
              <Label>Problema a resolver</Label>
              <Input placeholder="Ej: gestión de turnos manual" {...form.register("problem")} />
            </div>
            <div className="space-y-1">
              <Label>Presupuesto disponible</Label>
              <Input placeholder="Ej: USD 1000, sin inversión" {...form.register("budget")} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Skills del equipo</Label>
              <Input placeholder="Ej: Next.js, React Native, Python, IA" {...form.register("skills")} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generando ideas..." : "Generar 10 ideas"}
          </Button>
        </form>

        {ideas.length > 0 && (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground font-medium">Ideas generadas:</p>
            <div className="grid grid-cols-1 gap-2">
              {ideas.map((idea, i) => {
                const { score } = calculateScore({
                  revenuePotential: idea.revenuePotential,
                  complexity: idea.complexity,
                  synergy: idea.synergy,
                  risk: idea.risk as "LOW" | "MEDIUM" | "HIGH",
                  timeEstimate: idea.timeEstimate,
                });
                return (
                  <Card key={i} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TypeBadge type={idea.type as Parameters<typeof TypeBadge>[0]["type"]} />
                          <ScoreBadge
                            input={{ revenuePotential: idea.revenuePotential, complexity: idea.complexity, synergy: idea.synergy, risk: idea.risk as "LOW"|"MEDIUM"|"HIGH", timeEstimate: idea.timeEstimate }}
                            size="sm"
                          />
                        </div>
                        <p className="font-medium text-sm">{idea.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-8 gap-1"
                        onClick={() => { onSelectIdea(idea); onClose(); }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Usar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

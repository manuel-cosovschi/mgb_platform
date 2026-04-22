"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "./score-display";
import { calculateScore } from "@/lib/side-projects/score-engine";

export interface GeneratedIdea {
  title: string;
  description: string;
  problem: string;
  solution: string;
  targetAudience: string;
  type: string;
  revenueScore: number;
  easeScore: number;
  synergyScore: number;
  speedScore: number;
  riskScore: number;
  tags: string[];
  techStack: string[];
  emoji: string;
}

interface AIGeneratorProps {
  onAddIdea: (idea: GeneratedIdea) => void;
}

export function AIGenerator({ onAddIdea }: AIGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/side-projects/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      console.error("Error generating ideas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describí la industria o tipo de proyecto... (opcional)"
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <Button onClick={generate} disabled={loading} className="gap-2 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generar ideas
        </Button>
      </div>

      {ideas.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea, i) => {
            const score = calculateScore(idea);
            return (
              <Card key={i} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-lg">{idea.emoji}</span>
                    {idea.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground line-clamp-2">{idea.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <ScoreBadge score={score.total} size="sm" />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAddIdea(idea)}>
                      + Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

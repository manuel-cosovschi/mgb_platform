"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreDisplay } from "./score-display";
import { StatusBadge, TypeBadge } from "./badges";
import { getSmartSuggestions } from "@/lib/side-projects/score-engine";

interface ProjectData {
  id: string;
  title: string;
  emoji?: string | null;
  status: string;
  type: string;
  complexity: string;
  totalScore: number;
  revenueScore: number;
  easeScore: number;
  synergyScore: number;
  speedScore: number;
  riskScore: number;
}

interface IdeaComparatorProps {
  projects: ProjectData[];
}

export function IdeaComparator({ projects }: IdeaComparatorProps) {
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const left = projects.find((p) => p.id === leftId);
  const right = projects.find((p) => p.id === rightId);

  const getRecommendation = () => {
    if (!left || !right) return null;
    if (left.totalScore > right.totalScore + 10) return { winner: left, label: "Recomendado" };
    if (right.totalScore > left.totalScore + 10) return { winner: right, label: "Recomendado" };
    return { winner: null, label: "Ambas son comparables — decidir por sinergia o timing" };
  };

  const rec = getRecommendation();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Select value={leftId} onValueChange={setLeftId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar idea A..." /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.emoji} {p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rightId} onValueChange={setRightId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar idea B..." /></SelectTrigger>
          <SelectContent>
            {projects.filter((p) => p.id !== leftId).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.emoji} {p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {left && right && (
        <>
          {rec && (
            <div className="rounded-lg border bg-muted/30 p-3 text-center text-sm">
              {rec.winner ? (
                <span>🏆 <strong>{rec.winner.emoji} {rec.winner.title}</strong> — {rec.label}</span>
              ) : (
                <span>🤔 {rec.label}</span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {[left, right].map((p) => (
              <Card key={p.id} className={rec?.winner?.id === p.id ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    {p.title}
                  </CardTitle>
                  <div className="flex gap-1.5">
                    <StatusBadge status={p.status} />
                    <TypeBadge type={p.type} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScoreDisplay
                    revenueScore={p.revenueScore}
                    easeScore={p.easeScore}
                    synergyScore={p.synergyScore}
                    speedScore={p.speedScore}
                    riskScore={p.riskScore}
                    totalScore={p.totalScore}
                  />
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Smart Suggestions</p>
                    {getSmartSuggestions({ ...p, totalScore: p.totalScore }).map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{s}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

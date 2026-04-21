"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { calculateScore } from "@/lib/side-projects/score-engine";
import { Trophy, Minus } from "lucide-react";

interface ComparableProject {
  id: string;
  title: string;
  complexity: number;
  revenuePotential: number;
  synergy: number;
  risk: string;
  timeEstimate?: string | null;
  type: string;
}

interface IdeaComparatorProps {
  open: boolean;
  onClose: () => void;
  projects: ComparableProject[];
}

interface CompareRow {
  label: string;
  aVal: number;
  bVal: number;
  higherIsBetter: boolean;
  format?: (v: number) => string;
}

export function IdeaComparator({ open, onClose, projects }: IdeaComparatorProps) {
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const projectA = projects.find((p) => p.id === idA);
  const projectB = projects.find((p) => p.id === idB);

  const scoreA = projectA ? calculateScore({
    revenuePotential: projectA.revenuePotential,
    complexity: projectA.complexity,
    synergy: projectA.synergy,
    risk: projectA.risk as "LOW" | "MEDIUM" | "HIGH",
    timeEstimate: projectA.timeEstimate,
  }) : null;

  const scoreB = projectB ? calculateScore({
    revenuePotential: projectB.revenuePotential,
    complexity: projectB.complexity,
    synergy: projectB.synergy,
    risk: projectB.risk as "LOW" | "MEDIUM" | "HIGH",
    timeEstimate: projectB.timeEstimate,
  }) : null;

  const winner = scoreA && scoreB ? (scoreA.score > scoreB.score ? "A" : scoreA.score < scoreB.score ? "B" : "tie") : null;

  const rows: CompareRow[] = projectA && projectB ? [
    { label: "Score total",        aVal: scoreA!.score, bVal: scoreB!.score, higherIsBetter: true, format: (v) => `${v}/100` },
    { label: "Potencial ingresos", aVal: projectA.revenuePotential, bVal: projectB.revenuePotential, higherIsBetter: true, format: (v) => `${v}/10` },
    { label: "Facilidad (inv.)",   aVal: 10 - projectA.complexity, bVal: 10 - projectB.complexity, higherIsBetter: true, format: (v) => `${v}/10` },
    { label: "Sinergia agencia",   aVal: projectA.synergy, bVal: projectB.synergy, higherIsBetter: true, format: (v) => `${v}/10` },
    { label: "Riesgo (inv.)",      aVal: projectA.risk === "LOW" ? 10 : projectA.risk === "MEDIUM" ? 6 : 2, bVal: projectB.risk === "LOW" ? 10 : projectB.risk === "MEDIUM" ? 6 : 2, higherIsBetter: true, format: (v) => v === 10 ? "Bajo" : v === 6 ? "Medio" : "Alto" },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparar ideas</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Idea A</p>
            <Select value={idA} onValueChange={setIdA}>
              <SelectTrigger><SelectValue placeholder="Seleccionar idea..." /></SelectTrigger>
              <SelectContent>
                {projects.filter((p) => p.id !== idB).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Idea B</p>
            <Select value={idB} onValueChange={setIdB}>
              <SelectTrigger><SelectValue placeholder="Seleccionar idea..." /></SelectTrigger>
              <SelectContent>
                {projects.filter((p) => p.id !== idA).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {projectA && projectB && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => {
              const betterA = row.higherIsBetter ? row.aVal > row.bVal : row.aVal < row.bVal;
              const betterB = row.higherIsBetter ? row.bVal > row.aVal : row.bVal < row.aVal;
              const maxVal = Math.max(row.aVal, row.bVal, 1);
              return (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <div className="text-right">
                      <span className={cn("text-sm font-medium", betterA && "text-emerald-600")}>
                        {row.format ? row.format(row.aVal) : row.aVal}
                      </span>
                      <Progress value={(row.aVal / maxVal) * 100} className="h-1.5 mt-1" />
                    </div>
                    <div className="flex justify-center">
                      {betterA ? <span className="text-xs font-bold text-emerald-600">A &gt;</span> : betterB ? <span className="text-xs font-bold text-blue-600">&lt; B</span> : <Minus className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div>
                      <span className={cn("text-sm font-medium", betterB && "text-blue-600")}>
                        {row.format ? row.format(row.bVal) : row.bVal}
                      </span>
                      <Progress value={(row.bVal / maxVal) * 100} className="h-1.5 mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}

            {winner && winner !== "tie" && (
              <div className={cn(
                "mt-4 p-3 rounded-lg border flex items-center gap-2 font-medium",
                winner === "A" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"
              )}>
                <Trophy className="h-4 w-4" />
                Recomendación: construir{" "}
                <strong>{winner === "A" ? projectA.title : projectB.title}</strong> primero
              </div>
            )}
            {winner === "tie" && (
              <p className="text-sm text-center text-muted-foreground mt-2">Están empatadas — elegí la que más te apasione 🎯</p>
            )}
          </div>
        )}

        {(!projectA || !projectB) && (
          <p className="text-sm text-muted-foreground text-center py-4">Seleccioná dos ideas para comparar</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

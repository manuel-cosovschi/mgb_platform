"use client";

import { cn } from "@/lib/utils";
import { calculateScore, type ScoreInput } from "@/lib/side-projects/score-engine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ScoreBadgeProps {
  input: ScoreInput;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ input, showBreakdown = false, size = "md" }: ScoreBadgeProps) {
  const result = calculateScore(input);

  const colorClass =
    result.score >= 75 ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
    result.score >= 55 ? "bg-blue-500/10 text-blue-600 border-blue-200" :
    result.score >= 35 ? "bg-yellow-500/10 text-yellow-600 border-yellow-200" :
    "bg-red-500/10 text-red-600 border-red-200";

  const barColor =
    result.score >= 75 ? "bg-emerald-500" :
    result.score >= 55 ? "bg-blue-500" :
    result.score >= 35 ? "bg-yellow-500" :
    "bg-red-500";

  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : size === "lg" ? "text-base px-3 py-1.5" : "text-sm px-2 py-1";

  const badge = (
    <span className={cn("inline-flex items-center gap-1 rounded-full border font-medium", sizeClass, colorClass)}>
      <span>{result.emoji}</span>
      <span>{result.score}</span>
      {size !== "sm" && <span className="text-xs opacity-70">/ 100</span>}
    </span>
  );

  if (!showBreakdown) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="w-56 p-3 space-y-2">
          <p className="font-semibold text-sm">{result.emoji} {result.label} — {result.score}/100</p>
          <div className="space-y-1.5 text-xs">
            {[
              { label: "Potencial ingresos", value: result.breakdown.revenue, max: 30 },
              { label: "Facilidad ejecución", value: result.breakdown.ease, max: 25 },
              { label: "Sinergia con agencia", value: result.breakdown.synergy, max: 20 },
              { label: "Velocidad lanzamiento", value: result.breakdown.speed, max: 15 },
              { label: "Riesgo bajo", value: result.breakdown.risk, max: 10 },
            ].map(({ label, value, max }) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}/{max}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", barColor)} style={{ width: `${(value / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ScoreDisplayProps {
  score: number;
  className?: string;
}

export function ScoreDisplay({ score, className }: ScoreDisplayProps) {
  const label = score >= 75 ? "Excelente" : score >= 55 ? "Buena" : score >= 35 ? "Media" : "Mala";
  const emoji = score >= 75 ? "🔥" : score >= 55 ? "✅" : score >= 35 ? "⚠️" : "❌";
  const color = score >= 75 ? "text-emerald-600" : score >= 55 ? "text-blue-600" : score >= 35 ? "text-yellow-600" : "text-red-600";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-lg">{emoji}</span>
      <div>
        <p className={cn("font-bold text-xl", color)}>{score}/100</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <Progress value={score} className="h-2 flex-1" />
    </div>
  );
}

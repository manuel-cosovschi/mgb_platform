"use client";

import { cn } from "@/lib/utils";
import { getScoreLabel } from "@/lib/side-projects/score-engine";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = "md", showLabel = true, className }: ScoreBadgeProps) {
  const { label, emoji, color } = getScoreLabel(score);

  const sizes = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold border",
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
      title={`Score: ${score}/100 — ${label}`}
    >
      <span>{emoji}</span>
      <span>{score}</span>
      {showLabel && size !== "sm" && (
        <span className="opacity-80 text-[0.85em]">{label}</span>
      )}
    </span>
  );
}

interface ScoreDisplayProps {
  revenueScore: number;
  easeScore: number;
  synergyScore: number;
  speedScore: number;
  riskScore: number;
  totalScore: number;
  compact?: boolean;
}

const dimensionLabels = [
  { key: "revenueScore", label: "Revenue", weight: "30%", color: "#22c55e" },
  { key: "easeScore", label: "Facilidad", weight: "25%", color: "#3b82f6" },
  { key: "synergyScore", label: "Sinergia", weight: "20%", color: "#8b5cf6" },
  { key: "speedScore", label: "Velocidad", weight: "15%", color: "#f59e0b" },
  { key: "riskScore", label: "Riesgo (↑ = menos)", weight: "10%", color: "#ef4444" },
] as const;

export function ScoreDisplay({
  revenueScore, easeScore, synergyScore, speedScore, riskScore, totalScore, compact = false,
}: ScoreDisplayProps) {
  const scores: Record<string, number> = { revenueScore, easeScore, synergyScore, speedScore, riskScore };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Score Total</span>
        <ScoreBadge score={totalScore} size="lg" />
      </div>
      {!compact && (
        <div className="space-y-2">
          {dimensionLabels.map(({ key, label, weight, color }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {label} <span className="opacity-60">({weight})</span>
                </span>
                <span className="font-medium">{scores[key]}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(scores[key] / 10) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

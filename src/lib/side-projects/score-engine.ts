export interface ScoreInput {
  revenuePotential: number; // 1-10
  complexity: number;       // 1-10 (higher = more complex = worse)
  synergy: number;          // 1-10
  timeEstimate: string | null | undefined;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface ScoreResult {
  score: number;
  label: "Excelente" | "Buena" | "Media" | "Mala";
  emoji: string;
  breakdown: {
    revenue: number;
    ease: number;
    synergy: number;
    speed: number;
    risk: number;
  };
}

function riskPoints(risk: string): number {
  if (risk === "LOW") return 10;
  if (risk === "MEDIUM") return 6;
  return 2;
}

function speedPoints(timeEstimate: string | null | undefined): number {
  if (!timeEstimate) return 5;
  const t = timeEstimate.toLowerCase();
  if (t.includes("semana") || t.includes("week") || t.includes("día") || t.includes("day")) return 10;
  if (t.includes("mes") || t.includes("month") || t.includes("30") || t.includes("45")) return 7;
  if (t.includes("trimestre") || t.includes("quarter") || t.includes("90")) return 4;
  return 2;
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const revenue = Math.round((input.revenuePotential / 10) * 30);   // 0-30 pts
  const ease = Math.round(((10 - input.complexity) / 10) * 25);     // 0-25 pts (inverted)
  const synergy = Math.round((input.synergy / 10) * 20);            // 0-20 pts
  const speed = Math.round((speedPoints(input.timeEstimate) / 10) * 15); // 0-15 pts
  const risk = Math.round((riskPoints(input.risk) / 10) * 10);      // 0-10 pts

  const score = Math.min(100, revenue + ease + synergy + speed + risk);

  let label: ScoreResult["label"];
  let emoji: string;
  if (score >= 75) { label = "Excelente"; emoji = "🔥"; }
  else if (score >= 55) { label = "Buena"; emoji = "✅"; }
  else if (score >= 35) { label = "Media"; emoji = "⚠️"; }
  else { label = "Mala"; emoji = "❌"; }

  return { score, label, emoji, breakdown: { revenue, ease, synergy, speed, risk } };
}

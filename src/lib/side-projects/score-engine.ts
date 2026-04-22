// Side Projects — Score Engine
// Weighted formula: Revenue(30%) + Ease(25%) + Synergy(20%) + Speed(15%) + Risk(10%)
// Score range: 0-100

export interface ScoreInput {
  revenueScore: number; // 1-10
  easeScore: number;    // 1-10
  synergyScore: number; // 1-10
  speedScore: number;   // 1-10
  riskScore: number;    // 1-10 (higher = less risky = better)
}

export interface ScoreBreakdown {
  revenue: number;
  ease: number;
  synergy: number;
  speed: number;
  risk: number;
  total: number;
  label: string;
  emoji: string;
  color: string;
}

const WEIGHTS = {
  revenue: 0.30,
  ease: 0.25,
  synergy: 0.20,
  speed: 0.15,
  risk: 0.10,
} as const;

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const revenue = Math.round(input.revenueScore * WEIGHTS.revenue * 10);
  const ease = Math.round(input.easeScore * WEIGHTS.ease * 10);
  const synergy = Math.round(input.synergyScore * WEIGHTS.synergy * 10);
  const speed = Math.round(input.speedScore * WEIGHTS.speed * 10);
  const risk = Math.round(input.riskScore * WEIGHTS.risk * 10);
  const total = revenue + ease + synergy + speed + risk;

  return {
    revenue,
    ease,
    synergy,
    speed,
    risk,
    total,
    ...getScoreLabel(total),
  };
}

export function getScoreLabel(total: number): { label: string; emoji: string; color: string } {
  if (total >= 75) return { label: "Excelente", emoji: "🔥", color: "#22c55e" };
  if (total >= 55) return { label: "Buena", emoji: "✅", color: "#3b82f6" };
  if (total >= 35) return { label: "Media", emoji: "⚠️", color: "#f59e0b" };
  return { label: "Mala", emoji: "❌", color: "#ef4444" };
}

export function getSmartSuggestions(input: ScoreInput & { 
  totalScore: number;
  complexity: string;
  type: string;
}): string[] {
  const suggestions: string[] = [];

  if (input.totalScore >= 75) {
    suggestions.push("🚀 Construir ahora — Este proyecto tiene un score excelente");
  }

  // MVP time estimate based on complexity
  const complexityMap: Record<string, string> = {
    TRIVIAL: "1-2 semanas",
    SIMPLE: "2-4 semanas",
    MODERATE: "1-2 meses",
    COMPLEX: "2-4 meses",
    MASSIVE: "4-6 meses",
  };
  const mvpTime = complexityMap[input.complexity] || "2-3 meses";
  suggestions.push(`⏱️ MVP en ~${mvpTime} según complejidad`);

  if (input.synergyScore >= 8) {
    suggestions.push("🤝 Podría venderse a clientes actuales — Alta sinergia con el negocio");
  }

  // Compare with successful products by type
  const typeComparisons: Record<string, string> = {
    SAAS: "Stripe, Notion, Linear empezaron como side projects",
    MARKETPLACE: "Etsy, Fiverr nacieron como ideas de nicho",
    AGENCY_SERVICE: "Productizar servicios es la vía más rápida al revenue",
    TEMPLATE: "Templates generan ingresos pasivos con bajo mantenimiento",
    TOOL: "Las herramientas dev tienen alta retención cuando resuelven dolor real",
    CONTENT: "Content products escalan con distribución orgánica",
  };
  const comparison = typeComparisons[input.type];
  if (comparison) {
    suggestions.push(`💡 ${comparison}`);
  }

  if (input.revenueScore >= 8 && input.easeScore >= 7) {
    suggestions.push("💰 Alto potencial de revenue con ejecución simple — Priorizar");
  }

  if (input.riskScore <= 3) {
    suggestions.push("⚠️ Riesgo alto — Considerar validar con MVP antes de invertir fuerte");
  }

  return suggestions;
}

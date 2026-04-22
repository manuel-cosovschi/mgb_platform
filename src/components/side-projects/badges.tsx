"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
  IDEA: { label: "💡 Idea", variant: "secondary" },
  EVALUATING: { label: "🔍 Evaluando", variant: "info" },
  APPROVED: { label: "✅ Aprobada", variant: "success" },
  IN_DEVELOPMENT: { label: "🛠️ En desarrollo", variant: "purple" },
  MVP_READY: { label: "🚀 MVP Listo", variant: "warning" },
  LAUNCHED: { label: "🎯 Lanzado", variant: "success" },
  PAUSED: { label: "⏸️ Pausado", variant: "outline" },
  DISCARDED: { label: "❌ Descartado", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const typeConfig: Record<string, { label: string; emoji: string }> = {
  SAAS: { label: "SaaS", emoji: "☁️" },
  MARKETPLACE: { label: "Marketplace", emoji: "🏪" },
  AGENCY_SERVICE: { label: "Servicio", emoji: "🤝" },
  TEMPLATE: { label: "Template", emoji: "📋" },
  TOOL: { label: "Tool", emoji: "🔧" },
  CONTENT: { label: "Content", emoji: "📝" },
  PHYSICAL: { label: "Físico", emoji: "📦" },
  OTHER: { label: "Otro", emoji: "📌" },
};

export function TypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] ?? { label: type, emoji: "📌" };
  return (
    <Badge variant="outline" className="gap-1">
      <span>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  P1_NOW: { label: "P1 — Ahora", color: "#ef4444" },
  P2_NEXT: { label: "P2 — Siguiente", color: "#f59e0b" },
  P3_LATER: { label: "P3 — Después", color: "#3b82f6" },
  P4_MAYBE: { label: "P4 — Quizás", color: "#6b7280" },
  P5_SOMEDAY: { label: "P5 — Algún día", color: "#9ca3af" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] ?? { label: priority, color: "#6b7280" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
        borderColor: `${config.color}30`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}

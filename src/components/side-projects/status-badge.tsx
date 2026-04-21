import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SideProjectStatus = "IDEA" | "EVALUATING" | "VALIDATING" | "PRIORITIZED" | "IN_DEVELOPMENT" | "LAUNCHED" | "ARCHIVED";
type SideProjectType = "SAAS" | "MARKETPLACE" | "TOOL" | "AI" | "ECOMMERCE" | "APP" | "OTHER";

const STATUS_CONFIG: Record<SideProjectStatus, { label: string; color: string }> = {
  IDEA:           { label: "Idea nueva",    color: "bg-slate-100 text-slate-700 border-slate-200" },
  EVALUATING:     { label: "Evaluando",     color: "bg-blue-100 text-blue-700 border-blue-200" },
  VALIDATING:     { label: "Validando",     color: "bg-purple-100 text-purple-700 border-purple-200" },
  PRIORITIZED:    { label: "Priorizada",    color: "bg-orange-100 text-orange-700 border-orange-200" },
  IN_DEVELOPMENT: { label: "En desarrollo", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  LAUNCHED:       { label: "Lanzada",       color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ARCHIVED:       { label: "Archivada",     color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const TYPE_CONFIG: Record<SideProjectType, { label: string; emoji: string }> = {
  SAAS:        { label: "SaaS",        emoji: "☁️" },
  MARKETPLACE: { label: "Marketplace", emoji: "🛒" },
  TOOL:        { label: "Tool",        emoji: "🔧" },
  AI:          { label: "IA",          emoji: "🤖" },
  ECOMMERCE:   { label: "E-commerce",  emoji: "🏪" },
  APP:         { label: "App",         emoji: "📱" },
  OTHER:       { label: "Otro",        emoji: "📦" },
};

interface StatusBadgeProps {
  status: SideProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}

interface TypeBadgeProps {
  type: SideProjectType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", className)}>
      <span>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG, TYPE_CONFIG };

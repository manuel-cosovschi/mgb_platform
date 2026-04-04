import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // porcentaje, positivo o negativo
  trendLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  format?: "currency" | "number" | "percent" | "raw";
  currency?: "ARS" | "USD" | "EUR";
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  iconColor = "text-primary",
  format = "raw",
  currency = "ARS",
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  function formatValue(val: string | number): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);
    switch (format) {
      case "currency":
        return formatCurrency(num, currency);
      case "number":
        return formatNumber(num);
      case "percent":
        return `${num}%`;
      default:
        return String(val);
    }
  }

  const TrendIcon = trend === undefined || trend === 0
    ? Minus
    : trend > 0
    ? TrendingUp
    : TrendingDown;

  const trendColor =
    trend === undefined || trend === 0
      ? "text-muted-foreground"
      : trend > 0
      ? "text-emerald-500"
      : "text-destructive";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10", iconColor.replace("text-", "bg-").replace("-500", "-500/10").replace("-primary", "-primary/10"))}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{formatValue(value)}</p>
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <>
                <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {Math.abs(trend)}%
                </span>
              </>
            )}
            {(trendLabel || subtitle) && (
              <span className="text-xs text-muted-foreground">
                {trendLabel ?? subtitle}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { AlertTriangle, Clock, DollarSign, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReorderAnalysis } from "@/lib/reorder-engine";
import { cn } from "@/lib/utils";

interface ForecastSummaryProps {
  analyses: ReorderAnalysis[];
}

interface MetricDef {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}

export function ForecastSummary({ analyses }: ForecastSummaryProps) {
  const metrics = useMemo<MetricDef[]>(() => {
    const atRisk = analyses.filter(
      (a) => a.daysUntilStockout !== null && a.daysUntilStockout <= 30,
    ).length;

    const withStockout = analyses.filter((a) => a.daysUntilStockout !== null);
    const avgDaysOfSupply =
      withStockout.length > 0
        ? Math.round(
            withStockout.reduce((s, a) => s + (a.daysUntilStockout ?? 0), 0) / withStockout.length,
          )
        : 0;

    const totalReorderValue = analyses
      .filter(
        (a) =>
          Math.abs(a.suggestedReorderPoint - a.currentReorderPoint) / Math.max(a.currentReorderPoint, 1) > 0.15 ||
          (a.daysUntilStockout !== null && a.daysUntilStockout < 30),
      )
      .reduce((s, a) => s + a.suggestedReorderQuantity * (a.currentStock > 0 ? 1 : 1), 0);

    const needsAttention = analyses.filter(
      (a) =>
        Math.abs(a.suggestedReorderPoint - a.currentReorderPoint) / Math.max(a.currentReorderPoint, 1) > 0.15,
    ).length;

    return [
      {
        label: "Items At Risk",
        value: atRisk,
        icon: AlertTriangle,
        accent: atRisk > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Avg Days of Supply",
        value: `${avgDaysOfSupply}d`,
        icon: Clock,
      },
      {
        label: "Suggested Reorder Units",
        value: totalReorderValue.toLocaleString(),
        icon: DollarSign,
      },
      {
        label: "Items Needing Attention",
        value: needsAttention,
        icon: Settings2,
        accent: needsAttention > 0 ? "text-amber-600 dark:text-amber-400" : undefined,
      },
    ];
  }, [analyses]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2">
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className={cn("text-xl font-bold", m.accent)}>{m.value}</p>
              <p className="text-xs text-muted-foreground truncate">{m.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

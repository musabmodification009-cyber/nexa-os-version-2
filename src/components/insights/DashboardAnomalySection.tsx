import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnomalyAlertCard } from "@/components/insights/AnomalyAlertCard";
import { analyzeMovements } from "@/lib/anomaly-engine";
import type { StockMovement, Item } from "@/types/inventory";
import { subDays } from "date-fns";

interface DashboardAnomalySectionProps {
  movements: StockMovement[];
  items: Item[];
}

export function DashboardAnomalySection({ movements, items }: DashboardAnomalySectionProps) {
  const itemMap = useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  const anomalies = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    const recent = movements.filter((m) => new Date(m.createdAt) >= cutoff);
    return analyzeMovements(recent);
  }, [movements]);

  const top3 = anomalies.slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold">Anomaly Alerts</h2>
          <Badge variant="destructive" className="text-xs">{anomalies.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link to="/app/ai-insights" hash="anomalies">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3">
        {top3.map((a) => {
          const item = itemMap.get(a.itemId);
          return (
            <AnomalyAlertCard
              key={`${a.type}-${a.movementId}`}
              alert={a}
              itemName={item?.name}
              itemSku={item?.sku}
            />
          );
        })}
      </div>
    </section>
  );
}

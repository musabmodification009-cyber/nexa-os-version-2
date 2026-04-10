import { useMemo } from "react";
import { DollarSign, Package, BarChart3, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { Item } from "@/types/inventory";

interface StockSummaryCardsProps {
  items: Item[];
}

export function StockSummaryCards({ items }: StockSummaryCardsProps) {
  const metrics = useMemo(() => {
    const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.costPrice, 0);
    const totalSkus = items.length;
    const avgStock = items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.currentStock, 0) / items.length) : 0;
    const belowReorder = items.filter((i) => i.currentStock < i.reorderPoint).length;
    return { totalValue, totalSkus, avgStock, belowReorder };
  }, [items]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative overflow-hidden rounded-md border border-border bg-card p-5 pl-4">
        <div className="absolute left-2 top-2 bottom-2 w-[3px] rounded-full bg-primary" />
        <p className="text-sm text-muted-foreground">Total Inventory Value</p>
        <div className="mt-1 flex items-baseline gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-2xl font-bold text-foreground">
            {metrics.totalValue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      <MetricCard label="Total SKUs" value={metrics.totalSkus} accentColor="neutral" />
      <MetricCard label="Avg Stock Level" value={metrics.avgStock} accentColor="healthy" />
      <MetricCard label="Below Reorder Point" value={metrics.belowReorder} accentColor={metrics.belowReorder > 0 ? "warning" : "healthy"} />
    </div>
  );
}

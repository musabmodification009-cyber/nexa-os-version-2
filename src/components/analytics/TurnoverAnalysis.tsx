import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

interface TurnoverAnalysisProps {
  items: Item[];
  movements: StockMovement[];
}

export function TurnoverAnalysis({ items, movements }: TurnoverAnalysisProps) {
  const navigate = useNavigate();

  const { fastest, slowest, mostReordered } = useMemo(() => {
    // Outbound counts per item
    const outbound = new Map<string, number>();
    const receivedCount = new Map<string, number>();
    for (const m of movements) {
      if (m.type === MovementType.Shipped) outbound.set(m.itemId, (outbound.get(m.itemId) ?? 0) + Math.abs(m.quantity));
      if (m.type === MovementType.Received) receivedCount.set(m.itemId, (receivedCount.get(m.itemId) ?? 0) + 1);
    }

    const turnover = items.map((i) => {
      const out = outbound.get(i.id) ?? 0;
      const avgStock = Math.max(i.currentStock, 1);
      return { ...i, turnoverRate: out / avgStock, receivedCount: receivedCount.get(i.id) ?? 0 };
    });

    const fastest = [...turnover].sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 10);
    const slowest = [...turnover].sort((a, b) => a.turnoverRate - b.turnoverRate).slice(0, 10);
    const mostReordered = [...turnover].sort((a, b) => b.receivedCount - a.receivedCount).slice(0, 10);

    return { fastest, slowest, mostReordered };
  }, [items, movements]);

  const renderList = (title: string, list: typeof fastest, metric: (i: typeof fastest[0]) => string) => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="divide-y divide-border">
            {list.map((item, i) => (
              <button key={item.id} onClick={() => navigate({ to: "/app/catalog", search: { item: item.id } as any })}
                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm truncate">{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{item.sku}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0">{metric(item)}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {renderList("Fastest Moving", fastest, (i) => `${i.turnoverRate.toFixed(1)}× turnover`)}
      {renderList("Slowest Moving", slowest, (i) => `${i.turnoverRate.toFixed(1)}× turnover`)}
      {renderList("Most Reordered", mostReordered, (i) => `${i.receivedCount} receipts`)}
    </div>
  );
}

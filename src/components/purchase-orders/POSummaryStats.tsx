import { useMemo } from "react";
import { OrderStatus } from "@/types/inventory";
import type { PurchaseOrder } from "@/types/inventory";

interface POSummaryStatsProps {
  purchaseOrders: PurchaseOrder[];
}

export function POSummaryStats({ purchaseOrders }: POSummaryStatsProps) {
  const stats = useMemo(() => {
    let draft = 0;
    let awaiting = 0;
    let completed = 0;
    for (const po of purchaseOrders) {
      if (po.status === OrderStatus.Draft) draft++;
      else if (po.status === OrderStatus.Submitted) awaiting++;
      else if (po.status === OrderStatus.Received) completed++;
    }
    return { total: purchaseOrders.length, draft, awaiting, completed };
  }, [purchaseOrders]);

  const pills = [
    { label: "Total", value: stats.total },
    { label: "Draft", value: stats.draft },
    { label: "Awaiting Delivery", value: stats.awaiting },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {pills.map((p) => (
        <div
          key={p.label}
          className="rounded-xl border border-border/50 bg-muted/50 px-3 py-2 text-center"
        >
          <p className="text-xs text-muted-foreground">{p.label}</p>
          <p className="font-mono text-lg font-semibold text-foreground">{p.value}</p>
        </div>
      ))}
    </div>
  );
}

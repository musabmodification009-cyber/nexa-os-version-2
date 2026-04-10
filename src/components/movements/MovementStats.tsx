import { useMemo } from "react";
import { MovementType } from "@/types/inventory";
import type { StockMovement } from "@/types/inventory";

interface MovementStatsProps {
  movements: StockMovement[];
}

export function MovementStats({ movements }: MovementStatsProps) {
  const stats = useMemo(() => {
    let received = 0;
    let shipped = 0;
    let adjusted = 0;
    for (const m of movements) {
      if (m.type === MovementType.Received) received++;
      else if (m.type === MovementType.Shipped) shipped++;
      else if (m.type === MovementType.Adjusted) adjusted++;
    }
    return { total: movements.length, received, shipped, adjusted };
  }, [movements]);

  const pills = [
    { label: "Total", value: stats.total },
    { label: "Received", value: stats.received },
    { label: "Shipped", value: stats.shipped },
    { label: "Adjustments", value: stats.adjusted },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid="movement-stats">
      {pills.map((p) => (
        <div
          key={p.label}
          className="rounded-md border border-border bg-muted/50 px-3 py-2 text-center"
        >
          <p className="text-xs text-muted-foreground">{p.label}</p>
          <p className="text-lg font-semibold font-mono text-foreground">{p.value}</p>
        </div>
      ))}
    </div>
  );
}

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ArrowRightLeft } from "lucide-react";
import { MovementType } from "@/types/inventory";
import type { StockMovement } from "@/types/inventory";

const ICON_MAP: Record<MovementType, { icon: typeof ArrowDownToLine; cls: string }> = {
  [MovementType.Received]: { icon: ArrowDownToLine, cls: "text-stock-healthy bg-stock-healthy/10" },
  [MovementType.Shipped]: { icon: ArrowUpFromLine, cls: "text-stock-out bg-stock-out/10" },
  [MovementType.Adjusted]: { icon: RefreshCw, cls: "text-primary bg-primary/10" },
  [MovementType.Transferred]: { icon: ArrowRightLeft, cls: "text-muted-foreground bg-muted" },
};

interface MovementTimelineProps {
  movements: StockMovement[];
  itemId: string;
  maxEntries?: number;
}

export function MovementTimeline({ movements, itemId, maxEntries = 20 }: MovementTimelineProps) {
  const filtered = useMemo(() => {
    return movements
      .filter((m) => m.itemId === itemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, maxEntries);
  }, [movements, itemId, maxEntries]);

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No movement history for this item.</p>;
  }

  return (
    <div className="space-y-1">
      {filtered.map((m) => {
        const { icon: Icon, cls } = ICON_MAP[m.type];
        const isPositive = m.quantity > 0;
        return (
          <div key={m.id} className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted/40">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium capitalize">{m.type}</span>
                <span className={`font-mono text-sm font-semibold ${isPositive ? "text-stock-healthy" : "text-stock-out"}`}>
                  {isPositive ? "+" : ""}{m.quantity}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{m.performedBy}</span>
                {m.reference && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{m.reference}</span>
                  </>
                )}
              </div>
              {m.notes && <p className="mt-0.5 text-xs text-muted-foreground">{m.notes}</p>}
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}

      {/* View all link */}
      <div className="pt-3 text-center">
        <a
          href={`/app/movements?item=${itemId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all in movements →
        </a>
      </div>
    </div>
  );
}

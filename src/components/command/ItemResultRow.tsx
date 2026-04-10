import { Package } from "lucide-react";
import type { Item } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<ItemStatus, string> = {
  [ItemStatus.Active]: "bg-emerald-500",
  [ItemStatus.Discontinued]: "bg-muted-foreground",
  [ItemStatus.Archived]: "bg-muted-foreground",
};

interface ItemResultRowProps {
  item: Item;
}

export function ItemResultRow({ item }: ItemResultRowProps) {
  const isLow = item.currentStock > 0 && item.currentStock <= (item.reorderPoint ?? 0);
  const isOut = item.currentStock <= 0;

  return (
    <>
      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isOut ? "bg-destructive" : isLow ? "bg-amber-500" : STATUS_DOT[item.status] ?? "bg-emerald-500",
        )}
      />
      <span className="flex-1 truncate">{item.name}</span>
      <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {item.currentStock}
      </span>
    </>
  );
}

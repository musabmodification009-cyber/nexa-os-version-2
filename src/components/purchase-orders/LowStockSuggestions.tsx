import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Item } from "@/types/inventory";
import type { LineItemRow } from "./LineItemsEditor";

interface LowStockSuggestionsProps {
  items: Item[];
  supplierId: string;
  lineItems: LineItemRow[];
  onAdd: (row: LineItemRow) => void;
}

export function LowStockSuggestions({ items, supplierId, lineItems, onAdd }: LowStockSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!supplierId) return [];
    const alreadyAdded = new Set(lineItems.map((r) => r.itemId));
    return items.filter(
      (i) =>
        i.supplierId === supplierId &&
        i.currentStock <= i.reorderPoint &&
        !alreadyAdded.has(i.id),
    );
  }, [items, supplierId, lineItems]);

  if (suggestions.length === 0) return null;

  function handleAdd(item: Item) {
    const deficit = item.reorderPoint - item.currentStock;
    const suggestedQty = Math.ceil(deficit * 1.2);
    onAdd({
      id: crypto.randomUUID(),
      itemId: item.id,
      quantity: Math.max(1, suggestedQty),
      unitCost: item.costPrice,
    });
  }

  return (
    <div className="rounded-md border border-amber-accent/30 bg-amber-accent/5 p-3">
      <p className="mb-2 text-xs font-medium text-amber-accent">
        Low-stock items from this supplier
      </p>
      <div className="space-y-1.5">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {item.sku}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                Stock: {item.currentStock} / Reorder: {item.reorderPoint}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => handleAdd(item)}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

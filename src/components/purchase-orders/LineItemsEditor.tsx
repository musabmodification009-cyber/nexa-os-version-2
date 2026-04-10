import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Item } from "@/types/inventory";

export interface LineItemRow {
  id: string;
  itemId: string;
  quantity: number;
  unitCost: number;
}

interface LineItemsEditorProps {
  items: Item[];
  lineItems: LineItemRow[];
  onChange: (rows: LineItemRow[]) => void;
  error?: string;
}

export function LineItemsEditor({ items, lineItems, onChange, error }: LineItemsEditorProps) {
  function addRow() {
    onChange([
      ...lineItems,
      { id: crypto.randomUUID(), itemId: "", quantity: 1, unitCost: 0 },
    ]);
  }

  function removeRow(id: string) {
    onChange(lineItems.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof LineItemRow, value: string | number) {
    onChange(
      lineItems.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    );
  }

  function handleItemSelect(rowId: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    onChange(
      lineItems.map((r) =>
        r.id === rowId
          ? { ...r, itemId, unitCost: item?.costPrice ?? r.unitCost }
          : r,
      ),
    );
  }

  const runningTotal = lineItems.reduce(
    (sum, r) => sum + r.quantity * r.unitCost,
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Line Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
      </div>

      {lineItems.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No line items. Click "Add Item" to start.
        </p>
      )}

      {lineItems.map((row, idx) => {
        const lineTotal = row.quantity * row.unitCost;
        return (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_80px_100px_90px_32px] items-end gap-2 rounded-md border border-border bg-muted/30 p-3"
          >
            {/* Item select */}
            <div>
              {idx === 0 && (
                <Label className="mb-1 block text-xs text-muted-foreground">Item</Label>
              )}
              <Select
                value={row.itemId || "__none__"}
                onValueChange={(v) => handleItemSelect(row.id, v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Select item</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              {idx === 0 && (
                <Label className="mb-1 block text-xs text-muted-foreground">Qty</Label>
              )}
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={row.quantity}
                onChange={(e) => updateRow(row.id, "quantity", Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            {/* Unit Cost */}
            <div>
              {idx === 0 && (
                <Label className="mb-1 block text-xs text-muted-foreground">Unit Cost</Label>
              )}
              <Input
                type="number"
                min={0}
                step="0.01"
                className="h-8 text-xs"
                value={row.unitCost}
                onChange={(e) => updateRow(row.id, "unitCost", Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            {/* Line total */}
            <div>
              {idx === 0 && (
                <Label className="mb-1 block text-xs text-muted-foreground">Total</Label>
              )}
              <span className="flex h-8 items-center text-xs font-mono font-medium text-foreground">
                ${lineTotal.toFixed(2)}
              </span>
            </div>

            {/* Remove */}
            <div>
              {idx === 0 && <div className="mb-1 h-4" />}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(row.id)}
                aria-label="Remove line item"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {lineItems.length > 0 && (
        <div className="flex justify-end border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">
            Total:{" "}
            <span className="font-mono text-base">
              ${runningTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

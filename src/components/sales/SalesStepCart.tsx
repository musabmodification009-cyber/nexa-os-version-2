import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Item } from "@/types/inventory";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

function fmtNgn(usd: number, qty: number = 1): string {
  const ngn = usd * USD_TO_NGN * qty;
  return `${NAIRA}${ngn.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export interface CartItem {
  item: Item;
  quantity: number;
}

interface SalesStepCartProps {
  items: CartItem[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onNext: () => void;
}

export function SalesStepCart({ items, onAdd, onRemove, onClear, onNext }: SalesStepCartProps) {
  const total = items.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);
  const totalQty = items.reduce((s, ci) => s + ci.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <div className="rounded-full bg-muted p-5">
          <Trash2 className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs">Go back and add some products</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.map((ci) => (
          <div key={ci.item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/50">
              {ci.item.imageUrl ? (
                <img src={ci.item.imageUrl} alt={ci.item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ci.item.name}</p>
              <p className="text-xs text-muted-foreground">{fmtNgn(ci.item.sellingPrice)} each</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRemove(ci.item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold font-mono">{ci.quantity}</span>
              <button
                type="button"
                onClick={() => onAdd(ci.item.id)}
                disabled={ci.quantity >= ci.item.currentStock}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="min-w-16 text-right text-sm font-semibold font-mono">{fmtNgn(ci.item.sellingPrice, ci.quantity)}</p>
          </div>
        ))}
      </div>

      <Separator />

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalQty} item{totalQty !== 1 && "s"}</span>
          <span className="font-mono">{NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="font-mono">{NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
        </div>
        <Button onClick={onNext} className="w-full" size="lg">
          Proceed to Checkout
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={onClear}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear cart
        </Button>
      </div>
    </div>
  );
}

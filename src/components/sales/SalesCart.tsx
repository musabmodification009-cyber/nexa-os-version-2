import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Item, SaleTransaction } from "@/types/inventory";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";

const USD_TO_NGN = 1_580;
const NAIRA = "₦";

export interface CartItem {
  item: Item;
  quantity: number;
}

interface SalesCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function fmtNgn(usd: number, qty: number = 1): string {
  const ngn = usd * USD_TO_NGN * qty;
  return `${NAIRA}${ngn.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function SalesCart({ open, onOpenChange, items, onAdd, onRemove, onClear }: SalesCartProps) {
  const { demoStore, bumpVersion } = useDemo();
  const total = items.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);

  const handleCheckout = () => {
    if (demoStore) {
      const sale: SaleTransaction = {
        id: `sale-${Date.now()}`,
        items: items.map((ci) => ({
          itemId: ci.item.id,
          itemName: ci.item.name,
          sku: ci.item.sku,
          quantity: ci.quantity,
          unitPriceNgn: ci.item.sellingPrice * USD_TO_NGN,
          imageUrl: ci.item.imageUrl ?? undefined,
        })),
        totalNgn: total,
        createdAt: new Date().toISOString(),
      };
      demoStore.addSale(sale);
      bumpVersion();
    }
    toast.success(`Sale recorded — ${NAIRA}${total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`);
    onClear();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Cart ({items.length} products)</SheetTitle>
          <SheetDescription>Review items before completing the sale.</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Cart is empty
          </div>
        ) : (
          <>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {items.map((ci) => (
                <div key={ci.item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted/50">
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

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRemove(ci.item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold font-mono">{ci.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(ci.item.id)}
                      disabled={ci.quantity >= ci.item.currentStock}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="min-w-16 text-right text-sm font-semibold font-mono">{fmtNgn(ci.item.sellingPrice, ci.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">{NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Complete Sale
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={onClear}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

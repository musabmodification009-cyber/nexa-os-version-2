import { useState, useMemo } from "react";
import { Minus, Plus, Trash2, User, Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Item, SaleTransaction } from "@/types/inventory";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import { SalesReceipt } from "./SalesReceipt";

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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastSale, setLastSale] = useState<SaleTransaction | null>(null);
  const total = items.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);

  // Auto-suggest customer name from past sales
  const knownCustomers = useMemo(() => {
    const sales = demoStore?.getSales() ?? [];
    const map = new Map<string, string>();
    for (const sale of sales) {
      if (sale.customerPhone && sale.customerName) {
        map.set(sale.customerPhone, sale.customerName);
      }
    }
    return map;
  }, [demoStore]);

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value.length >= 8) {
      const found = knownCustomers.get(value);
      if (found && !customerName) setCustomerName(found);
    }
  };

  const handleCheckout = () => {
    const sale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
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

    if (demoStore) {
      demoStore.addSale(sale);
      bumpVersion();
    }

    setLastSale(sale);
    toast.success(`Sale recorded — ${NAIRA}${total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`);
    onClear();
    setCustomerName("");
    setCustomerPhone("");
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col sm:max-w-[440px]">
          <SheetHeader>
            <SheetTitle className="text-lg">Cart ({items.length} products)</SheetTitle>
            <SheetDescription>Review items and complete the sale.</SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Add products from the grid</p>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
                {items.map((ci) => (
                  <div key={ci.item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
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

              <Separator className="my-3" />

              {/* Customer details */}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer details (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-name" className="text-xs">Name</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer name"
                        className="h-9 pl-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-phone" className="text-xs">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="customer-phone"
                        value={customerPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="08012345678"
                        className="h-9 pl-8 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span className="font-mono text-sm">{NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
                </div>
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

      {/* Receipt modal */}
      {lastSale && (
        <SalesReceipt sale={lastSale} onClose={() => setLastSale(null)} />
      )}
    </>
  );
}

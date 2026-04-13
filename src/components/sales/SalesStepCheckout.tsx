import { useState, useMemo } from "react";
import { User, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import type { Item, SaleTransaction } from "@/types/inventory";
import { SalesReceipt } from "./SalesReceipt";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

export interface CheckoutItem {
  item: Item;
  quantity: number;
}

interface SalesStepCheckoutProps {
  items: CheckoutItem[];
  onComplete: () => void;
}

export function SalesStepCheckout({ items, onComplete }: SalesStepCheckoutProps) {
  const { demoStore, bumpVersion } = useDemo();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastSale, setLastSale] = useState<SaleTransaction | null>(null);

  const total = items.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);

  // Auto-suggest customer name
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
  };

  if (lastSale) {
    return (
      <SalesReceipt
        sale={lastSale}
        onClose={() => {
          setLastSale(null);
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4">
      {/* Customer details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Customer Details</h3>
          <p className="text-xs text-muted-foreground">Optional — helps with receipts and repeat tracking</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-name" className="text-xs">Customer Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="checkout-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Chidi Okonkwo"
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" className="text-xs">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="checkout-phone"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="08012345678"
                className="pl-10 h-11 font-mono"
              />
            </div>
            {customerPhone.length >= 8 && knownCustomers.has(customerPhone) && (
              <p className="text-xs text-primary">✓ Returning customer — {knownCustomers.get(customerPhone)}</p>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-5" />

      {/* Order summary */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
          {items.map((ci) => (
            <div key={ci.item.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground truncate mr-2">
                {ci.item.name} × {ci.quantity}
              </span>
              <span className="font-mono font-medium text-foreground shrink-0">
                {NAIRA}{(ci.item.sellingPrice * USD_TO_NGN * ci.quantity).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total and checkout button */}
      <div className="mt-auto pt-5 space-y-3">
        <div className="flex items-center justify-between text-xl font-bold">
          <span>Total</span>
          <span className="font-mono">{NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
        </div>
        <Button onClick={handleCheckout} className="w-full gap-2" size="lg">
          <CreditCard className="h-4 w-4" />
          Complete Sale — {NAIRA}{total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
        </Button>
      </div>
    </div>
  );
}

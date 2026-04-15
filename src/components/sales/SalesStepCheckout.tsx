import { useState, useMemo } from "react";
import { User, Phone, CreditCard, Tag, Percent, Wallet, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Item, SaleTransaction } from "@/types/inventory";
import type { Discount } from "@/types/finance";
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
  const { demoStore, bumpVersion, onboarding } = useDemo();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastSale, setLastSale] = useState<SaleTransaction | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ type: "percentage" | "flat"; value: number } | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [payOnCredit, setPayOnCredit] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "card">("cash");

  const subtotal = items.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);

  // Calculate discount
  const discountAmount = useMemo(() => {
    let amt = 0;
    if (discount) {
      amt += discount.type === "percentage" ? subtotal * (discount.value / 100) : discount.value;
    }
    if (promoApplied) {
      const base = subtotal - amt;
      amt += promoApplied.type === "percentage" ? base * (promoApplied.value / 100) : promoApplied.value;
    }
    return Math.min(amt, subtotal);
  }, [subtotal, discount, promoApplied]);

  const total = subtotal - discountAmount;

  // Tax
  const taxRate = onboarding.taxRate ?? 0;
  const taxAmount = total * (taxRate / 100);
  const grandTotal = total + taxAmount;

  const knownCustomers = useMemo(() => {
    const sales = demoStore?.getSales() ?? [];
    const map = new Map<string, string>();
    for (const sale of sales) {
      if (sale.customerPhone && sale.customerName) map.set(sale.customerPhone, sale.customerName);
    }
    return map;
  }, [demoStore]);

  // Auto-suggest by name too
  const customerSuggestions = useMemo(() => {
    if (!customerName && !customerPhone) return [];
    const sales = demoStore?.getSales() ?? [];
    const seen = new Map<string, { name: string; phone: string }>();
    for (const sale of sales) {
      if (sale.customerPhone && sale.customerName) {
        seen.set(sale.customerPhone, { name: sale.customerName, phone: sale.customerPhone });
      }
    }
    const all = Array.from(seen.values());
    const q = (customerName || customerPhone).toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4);
  }, [demoStore, customerName, customerPhone]);

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value.length >= 8) {
      const found = knownCustomers.get(value);
      if (found && !customerName) setCustomerName(found);
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim() || !demoStore) return;
    const promo = demoStore.validatePromo(promoCode);
    if (promo) {
      setPromoApplied({ type: promo.discountType, value: promo.discountValue });
      toast.success(`Promo "${promo.code}" applied!`);
    } else {
      toast.error("Invalid or expired promo code");
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
      totalNgn: grandTotal,
      createdAt: new Date().toISOString(),
    };

    if (demoStore) {
      demoStore.addSale(sale);
      if (promoApplied && promoCode) demoStore.usePromo(promoCode);
      if (payOnCredit && customerPhone.trim()) {
        demoStore.addCreditTransaction(customerPhone.trim(), customerName.trim() || "Unknown", {
          id: `ctxn-${Date.now()}`,
          type: "credit",
          amountNgn: grandTotal,
          saleId: sale.id,
          notes: "Sale on credit",
          createdAt: new Date().toISOString(),
        });
      }
      bumpVersion();
    }

    setLastSale(sale);
    toast.success(`Sale recorded — ${NAIRA}${grandTotal.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`);
  };

  if (lastSale) {
    return (
      <SalesReceipt
        sale={lastSale}
        onClose={() => { setLastSale(null); onComplete(); }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4 overflow-y-auto">
      {/* Customer details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Customer Details</h3>
          <p className="text-xs text-muted-foreground">Optional — helps with receipts and repeat tracking</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" className="text-xs">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="checkout-phone" value={customerPhone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="08012345678" className="pl-10 h-11 font-mono" />
            </div>
            {customerPhone.length >= 8 && knownCustomers.has(customerPhone) && (
              <p className="text-xs text-primary">✓ Returning customer — {knownCustomers.get(customerPhone)}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkout-name" className="text-xs">Customer Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="checkout-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Chidi Okonkwo" className="pl-10 h-11" />
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Discount & Promo */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Discounts & Promos</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Discount Type</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={discount?.type === "percentage" ? "default" : "outline"}
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setDiscount(discount?.type === "percentage" ? null : { type: "percentage", value: discount?.value ?? 0 })}
              >
                <Percent className="h-3 w-3" /> %
              </Button>
              <Button
                type="button"
                size="sm"
                variant={discount?.type === "flat" ? "default" : "outline"}
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setDiscount(discount?.type === "flat" ? null : { type: "flat", value: discount?.value ?? 0 })}
              >
                {NAIRA} Flat
              </Button>
            </div>
          </div>
          {discount && (
            <div className="space-y-1.5">
              <Label className="text-xs">Value</Label>
              <Input
                type="number"
                value={discount.value || ""}
                onChange={(e) => setDiscount({ ...discount, value: Number(e.target.value) })}
                placeholder={discount.type === "percentage" ? "e.g. 10" : "e.g. 500"}
                className="h-9"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Promo Code</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="WELCOME10" className="pl-10 h-9 font-mono text-xs" />
            </div>
            <Button size="sm" variant="outline" onClick={handleApplyPromo} className="h-9">Apply</Button>
          </div>
          {promoApplied && <p className="text-xs text-primary">✓ Promo applied: {promoApplied.type === "percentage" ? `${promoApplied.value}% off` : `${NAIRA}${promoApplied.value} off`}</p>}
        </div>

        {/* Credit toggle */}
        <button
          type="button"
          onClick={() => setPayOnCredit(!payOnCredit)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all w-full ${payOnCredit ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
        >
          <Wallet className="h-4 w-4" />
          {payOnCredit ? "Paying on credit ✓" : "Add to customer credit"}
        </button>
      </div>

      <Separator className="my-4" />

      {/* Order summary */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Order Summary</h3>
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
          {items.map((ci) => (
            <div key={ci.item.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground truncate mr-2">{ci.item.name} × {ci.quantity}</span>
              <span className="font-mono font-medium text-foreground shrink-0">
                {NAIRA}{(ci.item.sellingPrice * USD_TO_NGN * ci.quantity).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-primary pt-1 border-t border-border/50">
              <span>Discount</span>
              <span className="font-mono">-{NAIRA}{discountAmount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono">+{NAIRA}{taxAmount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Total and checkout button */}
      <div className="mt-auto pt-5 space-y-3">
        <div className="flex items-center justify-between text-xl font-bold">
          <span>Total</span>
          <span className="font-mono">{NAIRA}{grandTotal.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
        </div>
        <Button onClick={handleCheckout} className="w-full gap-2 h-12 text-base rounded-xl" size="lg">
          <CreditCard className="h-5 w-5" />
          {payOnCredit ? "Record Credit Sale" : "Complete Sale"}
        </Button>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { ShoppingCart, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useItems } from "@/hooks/useInventoryData";
import { cn } from "@/lib/utils";
import { SalesStepBrowse } from "./SalesStepBrowse";
import { SalesStepCart, type CartItem } from "./SalesStepCart";
import { SalesStepCheckout } from "./SalesStepCheckout";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

const STEPS = [
  { id: "browse", label: "Browse", icon: ShoppingCart },
  { id: "cart", label: "Review", icon: ArrowRight },
  { id: "checkout", label: "Checkout", icon: Check },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function SalesGrid() {
  const { data: items } = useItems();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [step, setStep] = useState<StepId>("browse");

  const addToCart = (itemId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(itemId, (next.get(itemId) ?? 0) + 1);
      return next;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = (next.get(itemId) ?? 0) - 1;
      if (qty <= 0) next.delete(itemId);
      else next.set(itemId, qty);
      return next;
    });
  };

  const cartItems: CartItem[] = useMemo(() => {
    const result: CartItem[] = [];
    cart.forEach((qty, id) => {
      const item = items.find((i) => i.id === id);
      if (item) result.push({ item, quantity: qty });
    });
    return result;
  }, [cart, items]);

  const totalItems = Array.from(cart.values()).reduce((s, q) => s + q, 0);
  const totalNaira = cartItems.reduce((s, ci) => s + ci.item.sellingPrice * USD_TO_NGN * ci.quantity, 0);

  const handleComplete = () => {
    setCart(new Map());
    setStep("browse");
  };

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Step indicator header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-foreground">Point of Sale</h1>
          {totalItems > 0 && step === "browse" && (
            <Button size="sm" className="gap-2" onClick={() => setStep("cart")}>
              <ShoppingCart className="h-4 w-4" />
              Cart
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 rounded-full px-1 text-[10px]">
                {totalItems}
              </Badge>
            </Button>
          )}
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id === "checkout" && cartItems.length === 0) return;
                if (s.id === "cart" || s.id === "browse") setStep(s.id);
                if (s.id === "checkout" && cartItems.length > 0) setStep(s.id);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                step === s.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : i < stepIdx
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                s.id === "checkout" && cartItems.length === 0 && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {step === "browse" && (
          <SalesStepBrowse cart={cart} onAdd={addToCart} onRemove={removeFromCart} />
        )}
        {step === "cart" && (
          <SalesStepCart
            items={cartItems}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onClear={() => setCart(new Map())}
            onNext={() => setStep("checkout")}
          />
        )}
        {step === "checkout" && (
          <SalesStepCheckout items={cartItems} onComplete={handleComplete} />
        )}
      </div>

      {/* Bottom navigation between steps */}
      {step !== "browse" && (
        <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step === "checkout" ? "cart" : "browse")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          {step === "cart" && (
            <div className="ml-auto text-sm font-mono font-bold">
              {NAIRA}{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
            </div>
          )}
        </div>
      )}

      {/* Floating bar on browse step */}
      {step === "browse" && totalItems > 0 && (
        <div className="border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setStep("cart")}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-semibold">{totalItems} item{totalItems !== 1 && "s"}</span>
            </div>
            <span className="text-base font-bold font-mono">
              {NAIRA}{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

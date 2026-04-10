import { useState, useMemo } from "react";
import { Minus, Plus, ShoppingCart, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useItems, useCategories } from "@/hooks/useInventoryData";
import { cn } from "@/lib/utils";
import { SalesCart, type CartItem } from "./SalesCart";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

function formatNaira(usd: number): string {
  const ngn = usd * USD_TO_NGN;
  return `${NAIRA}${ngn.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function SalesGrid() {
  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  const filtered = useMemo(() => {
    let list = items.filter((i) => i.currentStock > 0);
    if (activeCat) list = list.filter((i) => i.categoryId === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, activeCat]);

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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9 h-10"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          className="relative gap-2"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            !activeCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              activeCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => {
            const qty = cart.get(item.id) ?? 0;
            const ngnPrice = item.sellingPrice * USD_TO_NGN;

            return (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                {/* Product image */}
                <div className="relative aspect-square bg-muted/50">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground/30">
                      📦
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                      {qty}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                  <p className="mt-auto text-base font-bold text-foreground">{formatNaira(item.sellingPrice)}</p>
                  <p className="text-[10px] text-muted-foreground">{item.currentStock} in stock</p>
                </div>

                {/* +/- controls */}
                <div className="flex items-center border-t border-border">
                  <button
                    type="button"
                    disabled={qty === 0}
                    onClick={() => removeFromCart(item.id)}
                    className="flex h-10 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold font-mono">{qty}</span>
                  <button
                    type="button"
                    disabled={qty >= item.currentStock}
                    onClick={() => addToCart(item.id)}
                    className="flex h-10 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No products found</div>
        )}
      </div>

      {/* Floating total bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[260px]">
          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:brightness-110"
          >
            <span className="font-semibold">{totalItems} item{totalItems !== 1 && "s"}</span>
            <span className="text-lg font-bold">{NAIRA}{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
          </button>
        </div>
      )}

      {/* Cart sheet */}
      <SalesCart
        open={showCart}
        onOpenChange={setShowCart}
        items={cartItems}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onClear={() => setCart(new Map())}
      />
    </div>
  );
}

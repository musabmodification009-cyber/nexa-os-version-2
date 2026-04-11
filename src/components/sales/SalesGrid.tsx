import { useState, useMemo } from "react";
import { Minus, Plus, ShoppingCart, Search, X, Package } from "lucide-react";
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
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground shrink-0">Point of Sale</h1>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
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
            className="relative gap-2 shrink-0"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto border-b border-border bg-card/50 px-4 py-2.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            !activeCat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              activeCat === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const qty = cart.get(item.id) ?? 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border bg-card transition-all",
                    qty > 0 ? "border-primary/40 shadow-md ring-1 ring-primary/20" : "border-border hover:shadow-md"
                  )}
                >
                  {/* Product image */}
                  <div className="relative aspect-square bg-muted/30">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground/20">
                        📦
                      </div>
                    )}
                    {qty > 0 && (
                      <div className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                        {qty}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
                        {item.currentStock} left
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-0.5 p-3">
                    <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{item.sku}</p>
                    <p className="mt-auto pt-1 text-base font-bold text-foreground">{formatNaira(item.sellingPrice)}</p>
                  </div>

                  {/* +/- controls */}
                  <div className="flex items-center border-t border-border">
                    <button
                      type="button"
                      disabled={qty === 0}
                      onClick={() => removeFromCart(item.id)}
                      className="flex h-11 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-20"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold font-mono">{qty}</span>
                    <button
                      type="button"
                      disabled={qty >= item.currentStock}
                      onClick={() => addToCart(item.id)}
                      className="flex h-11 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating total bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:left-[260px]">
          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-semibold">{totalItems} item{totalItems !== 1 && "s"}</span>
            </div>
            <span className="text-lg font-bold font-mono">{NAIRA}{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
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

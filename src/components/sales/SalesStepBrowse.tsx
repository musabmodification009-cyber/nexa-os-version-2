import { useState, useMemo } from "react";
import { Plus, Minus, Package, Search, X, TrendingUp, UserCheck, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useItems, useCategories } from "@/hooks/useInventoryData";
import { useDemo } from "@/hooks/useDemo";
import { cn } from "@/lib/utils";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

function formatNaira(usd: number): string {
  const ngn = usd * USD_TO_NGN;
  return `${NAIRA}${ngn.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface SalesStepBrowseProps {
  cart: Map<string, number>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SalesStepBrowse({ cart, onAdd, onRemove }: SalesStepBrowseProps) {
  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const { demoStore } = useDemo();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const totalItems = Array.from(cart.values()).reduce((s, q) => s + q, 0);

  const topSellers = useMemo(() => {
    const sales = demoStore?.getSales() ?? [];
    const counts = new Map<string, number>();
    for (const sale of sales) {
      for (const li of sale.items) {
        counts.set(li.itemId, (counts.get(li.itemId) ?? 0) + li.quantity);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => items.find((i) => i.id === id))
      .filter(Boolean);
  }, [demoStore, items]);

  const repeatCustomers = useMemo(() => {
    const sales = demoStore?.getSales() ?? [];
    const map = new Map<string, { name: string; phone: string; count: number }>();
    for (const sale of sales) {
      if (sale.customerPhone) {
        const key = sale.customerPhone;
        const existing = map.get(key);
        if (existing) existing.count++;
        else map.set(key, { name: sale.customerName ?? "Unknown", phone: key, count: 1 });
      }
    }
    return Array.from(map.values())
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [demoStore]);

  const isSearchEmpty = !search.trim() && !activeCat;

  const filtered = useMemo(() => {
    let list = items.filter((i) => i.currentStock > 0);
    if (activeCat) list = list.filter((i) => i.categoryId === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, activeCat]);

  return (
    <div className="flex h-full flex-col relative pb-24">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
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
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCat(null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            !activeCat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
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
              activeCat === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Smart suggestions when search is empty */}
      {isSearchEmpty && (topSellers.length > 0 || repeatCustomers.length > 0) && (
        <div className="border-b border-border px-4 pb-3 space-y-3">
          {topSellers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Sellers</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {topSellers.map((item) => item && (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onAdd(item.id)}
                    className="shrink-0 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center text-sm overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : "📦"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate max-w-24">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{formatNaira(item.sellingPrice)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {repeatCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repeat Customers</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {repeatCustomers.map((c) => (
                  <div key={c.phone} className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.phone}</p>
                    <Badge variant="secondary" className="mt-1 text-[9px]">{c.count} orders</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <div className="rounded-full bg-muted p-4"><Package className="h-8 w-8" /></div>
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 py-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const qty = cart.get(item.id) ?? 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border bg-card transition-all",
                    qty > 0 ? "border-primary/40 shadow-md ring-1 ring-primary/20" : "border-border hover:shadow-sm"
                  )}
                >
                  <div className="relative aspect-square bg-muted/20">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/15">📦</div>
                    )}
                    {qty > 0 && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {qty}
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[9px] font-medium text-muted-foreground backdrop-blur-sm">
                      {item.currentStock} left
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <p className="text-xs font-medium leading-tight line-clamp-2 text-foreground">{item.name}</p>
                    <p className="mt-auto pt-0.5 text-sm font-bold text-foreground">{formatNaira(item.sellingPrice)}</p>
                  </div>

                  <div className="flex items-center border-t border-border">
                    <button
                      type="button"
                      disabled={qty === 0}
                      onClick={() => onRemove(item.id)}
                      className="flex h-12 flex-1 items-center justify-center text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-20 active:scale-90"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold font-mono">{qty}</span>
                    <button
                      type="button"
                      disabled={qty >= item.currentStock}
                      onClick={() => onAdd(item.id)}
                      className="flex h-12 flex-1 items-center justify-center text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-20 active:scale-90"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed centered Sell button */}
      {totalItems > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-6">
          <button
            type="button"
            onClick={() => {
              // Dispatch custom event for parent to catch — or use onAdd as proxy
              const event = new CustomEvent("pos-go-to-cart");
              window.dispatchEvent(event);
            }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:brightness-110 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-base font-bold">
              Sell · {totalItems} item{totalItems !== 1 && "s"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

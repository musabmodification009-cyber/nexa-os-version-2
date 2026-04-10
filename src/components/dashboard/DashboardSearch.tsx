import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useItems } from "@/hooks/useInventoryData";
import { StatusBadge } from "@/components/StatusBadge";
import type { Item } from "@/types/inventory";

function stockStatus(item: Item) {
  if (item.currentStock === 0) return "out-of-stock" as const;
  if (item.currentStock <= item.reorderPoint) return "low-stock" as const;
  return "in-stock" as const;
}

export function DashboardSearch() {
  const { data: items } = useItems();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? items.filter((i) => {
        const q = query.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: Item) => {
    setQuery("");
    setOpen(false);
    navigate({ to: "/app/catalog", search: { item: item.id } });
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 transition-colors focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search items by name, SKU, or barcode..."
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute top-full z-40 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No items found</p>
          ) : (
            <ul className="divide-y divide-border py-1">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.sku}</span>
                    <StatusBadge status={stockStatus(item)} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

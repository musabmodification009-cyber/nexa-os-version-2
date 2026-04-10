import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Item, Category, Supplier, Location } from "@/types/inventory";

type SortDir = "asc" | "desc" | null;
type SortKey = "name" | "sku" | "currentStock" | "categoryId" | "supplierId";

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

function stockStatus(item: Item) {
  if (item.currentStock === 0) return "out-of-stock" as const;
  if (item.currentStock <= item.reorderPoint) return "low-stock" as const;
  return "in-stock" as const;
}

interface CatalogTableProps {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
  sort: SortState;
  onSortChange: (s: SortState) => void;
  selected: Set<string>;
  onSelectedChange: (s: Set<string>) => void;
  onRowClick?: (item: Item) => void;
  actionRenderer?: (item: Item) => React.ReactNode;
  showCheckboxes?: boolean;
}

const PER_PAGE = 20;

export function CatalogTable({
  items,
  categories,
  suppliers,
  locations,
  sort,
  onSortChange,
  selected,
  onSelectedChange,
  onRowClick,
  actionRenderer,
  showCheckboxes = true,
}: CatalogTableProps) {
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const supMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return items;
    const k = sort.key;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = a[k] ?? "";
      const bv = b[k] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [items, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const start = safePage * PER_PAGE + 1;
  const end = Math.min((safePage + 1) * PER_PAGE, sorted.length);

  const toggleSort = (key: SortKey) => {
    if (sort.key !== key) { onSortChange({ key, dir: "asc" }); setPage(0); }
    else if (sort.dir === "asc") { onSortChange({ key, dir: "desc" }); setPage(0); }
    else { onSortChange({ key: null, dir: null }); }
  };

  const changePage = (newPage: number) => {
    setPage(newPage);
    onSelectedChange(new Set());
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort.key !== col) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    return sort.dir === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const allSelected = paged.length > 0 && paged.every((i) => selected.has(i.id));

  if (sorted.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No items in catalog</p>;
  }

  const pagination = (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>Showing {start}–{end} of {sorted.length} items</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => changePage(safePage - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => changePage(safePage + 1)}>Next</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div>
        <div className="space-y-3">
          {paged.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick?.(item)}
            >
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">{item.name}</CardTitle>
                  <StatusBadge status={stockStatus(item)} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-mono text-xs">{item.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qty</span>
                  <span className="font-mono">{item.currentStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="truncate ml-2">{catMap.get(item.categoryId ?? "") ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="truncate ml-2">{supMap.get(item.supplierId ?? "") ?? "—"}</span>
                </div>
                {actionRenderer && (
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    {actionRenderer(item)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {pagination}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => {
                      if (v) onSelectedChange(new Set(paged.map((i) => i.id)));
                      else onSelectedChange(new Set());
                    }}
                  />
                </TableHead>
              )}
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>Name<SortIcon col="name" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("sku")}>SKU<SortIcon col="sku" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("categoryId")}>Category<SortIcon col="categoryId" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("currentStock")}>Qty<SortIcon col="currentStock" /></TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("supplierId")}>Supplier<SortIcon col="supplierId" /></TableHead>
              {actionRenderer && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((item) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer hover:bg-muted/50 ${selected.has(item.id) ? "bg-primary/5" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {showCheckboxes && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        v ? next.add(item.id) : next.delete(item.id);
                        onSelectedChange(next);
                      }}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{catMap.get(item.categoryId ?? "") ?? (item.categoryId ? <span className="italic text-muted-foreground/60">Unknown Category</span> : "—")}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-sm">{item.currentStock}</span>
                    <StatusBadge status={stockStatus(item)} />
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{locMap.get(item.locationId ?? "") ?? (item.locationId ? <span className="italic text-muted-foreground/60">Unknown Location</span> : "—")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{supMap.get(item.supplierId ?? "") ?? (item.supplierId ? <span className="italic text-muted-foreground/60">Unknown Supplier</span> : "—")}</TableCell>
                {actionRenderer && (
                  <TableCell onClick={(e) => e.stopPropagation()}>{actionRenderer(item)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination}
    </div>
  );
}

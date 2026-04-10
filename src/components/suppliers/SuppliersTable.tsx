import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Supplier, Item } from "@/types/inventory";

interface SuppliersTableProps {
  suppliers: Supplier[];
  items: Item[];
  onRowClick?: (s: Supplier) => void;
}

const PER_PAGE = 20;

export function SuppliersTable({ suppliers, items, onRowClick }: SuppliersTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();

  const itemCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.supplierId) map.set(item.supplierId, (map.get(item.supplierId) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = q ? suppliers.filter((s) => s.name.toLowerCase().includes(q)) : suppliers;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const start = safePage * PER_PAGE + 1;
  const end = Math.min((safePage + 1) * PER_PAGE, filtered.length);

  const pagination = filtered.length > 0 && (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Showing {start}–{end} of {filtered.length} suppliers</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Next</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search suppliers…" className="h-9 pl-8 text-sm bg-white" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{search ? "No suppliers match your search" : "No suppliers added yet"}</p>
      ) : isMobile ? (
        <>
          <div className="space-y-3">
            {paged.map((s) => (
              <Card key={s.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onRowClick?.(s)}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{s.contactName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Lead Time</span><span className="font-mono">{s.leadTimeDays}d</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-mono">{itemCountMap.get(s.id) ?? 0}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {pagination}
        </>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px]">Lead Time</TableHead>
                  <TableHead className="w-[100px]">Items</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick?.(s)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.contactName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.phone || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">{s.leadTimeDays}d</TableCell>
                    <TableCell className="text-sm font-mono">{itemCountMap.get(s.id) ?? 0}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pagination}
        </>
      )}
    </div>
  );
}

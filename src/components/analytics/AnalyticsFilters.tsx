import { Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Category, Supplier, Location } from "@/types/inventory";

export interface AnalyticsFilterValues {
  categoryId: string | null;
  supplierId: string | null;
  locationId: string | null;
  days: number;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilterValues;
  onChange: (filters: AnalyticsFilterValues) => void;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
}

const DATE_PRESETS = [
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "This Year", value: 365 },
];

export function AnalyticsFilters({ filters, onChange, categories, suppliers, locations }: AnalyticsFiltersProps) {
  const activeCount = [filters.categoryId, filters.supplierId, filters.locationId].filter(Boolean).length;

  const set = (key: keyof AnalyticsFilterValues, value: string | number | null) =>
    onChange({ ...filters, [key]: value });

  const clearAll = () => onChange({ ...filters, categoryId: null, supplierId: null, locationId: null });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={String(filters.days)} onValueChange={(v) => set("days", Number(v))}>
        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((p) => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="h-4 w-px bg-border" />

      <Select value={filters.categoryId ?? "__all__"} onValueChange={(v) => set("categoryId", v === "__all__" ? null : v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Categories</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.supplierId ?? "__all__"} onValueChange={(v) => set("supplierId", v === "__all__" ? null : v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Supplier" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Suppliers</SelectItem>
          {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.locationId ?? "__all__"} onValueChange={(v) => set("locationId", v === "__all__" ? null : v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Locations</SelectItem>
          {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <>
          <Badge variant="secondary" className="text-xs">{activeCount} filter{activeCount !== 1 && "s"}</Badge>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearAll}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        </>
      )}
    </div>
  );
}

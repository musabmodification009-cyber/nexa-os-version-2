import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OrderStatus } from "@/types/inventory";
import type { Supplier } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import type { POFilters } from "./po-filter-types";
import { EMPTY_PO_FILTERS, isFiltersActive, activeFilterCount } from "./po-filter-types";

const STATUS_OPTIONS = [
  { value: OrderStatus.Draft, label: "Draft" },
  { value: OrderStatus.Submitted, label: "Submitted" },
  { value: OrderStatus.Partial, label: "Partially Received" },
  { value: OrderStatus.Received, label: "Fully Received" },
  { value: OrderStatus.Cancelled, label: "Cancelled" },
];

interface PurchaseOrdersFiltersProps {
  filters: POFilters;
  onChange: (f: POFilters) => void;
  suppliers: Supplier[];
}

function FilterControls({ filters, onChange, suppliers }: PurchaseOrdersFiltersProps) {
  const toggleStatus = (s: OrderStatus) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((v) => v !== s)
      : [...filters.statuses, s];
    onChange({ ...filters, statuses: next });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status multi-select */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.statuses.includes(o.value)}
                onCheckedChange={() => toggleStatus(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {/* Supplier select */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Supplier</Label>
        <Select
          value={filters.supplierId ?? "__all__"}
          onValueChange={(v) => onChange({ ...filters, supplierId: v === "__all__" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
          />
        </div>
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
          />
        </div>
      </div>

      {isFiltersActive(filters) && (
        <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs" onClick={() => onChange(EMPTY_PO_FILTERS)}>
          <X className="h-3 w-3" />Clear Filters
        </Button>
      )}
    </div>
  );
}

export function PurchaseOrdersFilters(props: PurchaseOrdersFiltersProps) {
  const isMobile = useIsMobile();
  const count = activeFilterCount(props.filters);

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filters
            {count > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{count}</Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterControls {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status */}
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={props.filters.statuses.includes(o.value)}
                  onCheckedChange={() => {
                    const next = props.filters.statuses.includes(o.value)
                      ? props.filters.statuses.filter((v) => v !== o.value)
                      : [...props.filters.statuses, o.value];
                    props.onChange({ ...props.filters, statuses: next });
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* Supplier */}
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Supplier</Label>
          <Select
            value={props.filters.supplierId ?? "__all__"}
            onValueChange={(v) => props.onChange({ ...props.filters, supplierId: v === "__all__" ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All suppliers</SelectItem>
              {props.suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Date Range</Label>
          <div className="flex gap-1">
            <Input
              type="date"
              className="h-8 text-xs"
              value={props.filters.dateFrom ?? ""}
              onChange={(e) => props.onChange({ ...props.filters, dateFrom: e.target.value || null })}
            />
            <Input
              type="date"
              className="h-8 text-xs"
              value={props.filters.dateTo ?? ""}
              onChange={(e) => props.onChange({ ...props.filters, dateTo: e.target.value || null })}
            />
          </div>
        </div>

        {/* Clear */}
        <div className="flex items-end">
          {isFiltersActive(props.filters) && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => props.onChange(EMPTY_PO_FILTERS)}>
              <X className="h-3 w-3" />Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

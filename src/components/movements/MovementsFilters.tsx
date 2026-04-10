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
import { MovementType } from "@/types/inventory";
import type { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MovementFilters } from "./movement-filter-types";
import { EMPTY_MOVEMENT_FILTERS, isFiltersActive, activeFilterCount } from "./movement-filter-types";

const TYPE_OPTIONS = [
  { value: MovementType.Received, label: "Received" },
  { value: MovementType.Shipped, label: "Shipped" },
  { value: MovementType.Adjusted, label: "Adjusted" },
  { value: MovementType.Transferred, label: "Transferred" },
];

interface MovementsFiltersProps {
  filters: MovementFilters;
  onChange: (f: MovementFilters) => void;
  items: Item[];
  performers: string[];
}

function FilterControls({ filters, onChange, items, performers }: MovementsFiltersProps) {
  const toggleType = (t: MovementType) => {
    const next = filters.types.includes(t)
      ? filters.types.filter((v) => v !== t)
      : [...filters.types, t];
    onChange({ ...filters, types: next });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Type multi-select */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Type</Label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.types.includes(o.value)}
                onCheckedChange={() => toggleType(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {/* Item select */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Item</Label>
        <Select
          value={filters.itemId ?? "__all__"}
          onValueChange={(v) => onChange({ ...filters, itemId: v === "__all__" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All items</SelectItem>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
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

      {/* Performer */}
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Performed By</Label>
        <Select
          value={filters.performedBy ?? "__all__"}
          onValueChange={(v) => onChange({ ...filters, performedBy: v === "__all__" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {performers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltersActive(filters) && (
        <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs" onClick={() => onChange(EMPTY_MOVEMENT_FILTERS)}>
          <X className="h-3 w-3" />Clear Filters
        </Button>
      )}
    </div>
  );
}

export function MovementsFilters(props: MovementsFiltersProps) {
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Type */}
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Type</Label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={props.filters.types.includes(o.value)}
                  onCheckedChange={() => {
                    const next = props.filters.types.includes(o.value)
                      ? props.filters.types.filter((v) => v !== o.value)
                      : [...props.filters.types, o.value];
                    props.onChange({ ...props.filters, types: next });
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* Item */}
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Item</Label>
          <Select
            value={props.filters.itemId ?? "__all__"}
            onValueChange={(v) => props.onChange({ ...props.filters, itemId: v === "__all__" ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All items</SelectItem>
              {props.items.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
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

        {/* Performer */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Performed By</Label>
            <Select
              value={props.filters.performedBy ?? "__all__"}
              onValueChange={(v) => props.onChange({ ...props.filters, performedBy: v === "__all__" ? null : v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {props.performers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFiltersActive(props.filters) && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => props.onChange(EMPTY_MOVEMENT_FILTERS)}>
              <X className="h-3 w-3" />Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/types/inventory";
import type { RequestFilters } from "./request-filter-types";
import { EMPTY_REQUEST_FILTERS } from "./request-filter-types";

const STATUSES: { value: RequestStatus; label: string }[] = [
  { value: RequestStatus.Pending, label: "Pending" },
  { value: RequestStatus.Approved, label: "Approved" },
  { value: RequestStatus.PartiallyFulfilled, label: "Partial" },
  { value: RequestStatus.Fulfilled, label: "Fulfilled" },
  { value: RequestStatus.Declined, label: "Declined" },
  { value: RequestStatus.Cancelled, label: "Cancelled" },
];

interface RequestsFiltersProps {
  filters: RequestFilters;
  onChange: (filters: RequestFilters) => void;
}

export function RequestsFilters({ filters, onChange }: RequestsFiltersProps) {
  const hasFilters =
    filters.statuses.length > 0 || filters.requestor || filters.dateFrom || filters.dateTo;

  function toggleStatus(status: RequestStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUSES.map((s) => (
        <Badge
          key={s.value}
          variant={filters.statuses.includes(s.value) ? "default" : "outline"}
          className="cursor-pointer select-none"
          onClick={() => toggleStatus(s.value)}
        >
          {s.label}
        </Badge>
      ))}
      <Input
        placeholder="Requestor..."
        value={filters.requestor}
        onChange={(e) => onChange({ ...filters, requestor: e.target.value })}
        className="h-8 w-32"
      />
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="h-8 w-36"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="h-8 w-36"
        aria-label="To date"
      />
      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-xs"
          onClick={() => onChange(EMPTY_REQUEST_FILTERS)}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}

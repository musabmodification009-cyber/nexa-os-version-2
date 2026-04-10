import type { OrderStatus } from "@/types/inventory";

export interface POFilters {
  statuses: OrderStatus[];
  supplierId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_PO_FILTERS: POFilters = {
  statuses: [],
  supplierId: null,
  dateFrom: null,
  dateTo: null,
};

export function isFiltersActive(f: POFilters): boolean {
  return f.statuses.length > 0 || f.supplierId !== null || f.dateFrom !== null || f.dateTo !== null;
}

export function activeFilterCount(f: POFilters): number {
  let c = 0;
  if (f.statuses.length > 0) c++;
  if (f.supplierId) c++;
  if (f.dateFrom || f.dateTo) c++;
  return c;
}

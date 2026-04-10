import { MovementType } from "@/types/inventory";

export interface MovementFilters {
  types: MovementType[];
  itemId: string | null;
  performedBy: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_MOVEMENT_FILTERS: MovementFilters = {
  types: [],
  itemId: null,
  performedBy: null,
  dateFrom: null,
  dateTo: null,
};

export function isFiltersActive(f: MovementFilters): boolean {
  return f.types.length > 0 || !!f.itemId || !!f.performedBy || !!f.dateFrom || !!f.dateTo;
}

export function activeFilterCount(f: MovementFilters): number {
  let n = 0;
  if (f.types.length > 0) n++;
  if (f.itemId) n++;
  if (f.performedBy) n++;
  if (f.dateFrom || f.dateTo) n++;
  return n;
}

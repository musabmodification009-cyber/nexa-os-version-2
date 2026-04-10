import { useMemo } from "react";
import { useDemo } from "@/hooks/useDemo";
import type {
  Item,
  Category,
  Supplier,
  Location,
  StockMovement,
  PurchaseOrder,
  InventoryRequest,
} from "@/types/inventory";
import type { ItemFilters, StockSummary } from "@/lib/demo-store";

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
}

export function useItems(filters?: ItemFilters): QueryResult<Item[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: demoStore.getItems(filters), isLoading: false, error: null };
    return { data: [] as Item[], isLoading: false, error: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, demoStore, version, filters?.categoryId, filters?.supplierId, filters?.status, filters?.search, filters?.locationId]);
}

export function useItemById(id: string): QueryResult<Item | undefined> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: demoStore.getItemById(id), isLoading: false, error: null };
    return { data: undefined, isLoading: false, error: null };
  }, [isDemo, demoStore, version, id]);
}

export function useCategories(): QueryResult<Category[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: demoStore.getCategories(), isLoading: false, error: null };
    return { data: [] as Category[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function useSuppliers(): QueryResult<Supplier[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: [...demoStore.getSuppliers()], isLoading: false, error: null };
    return { data: [] as Supplier[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function useLocations(): QueryResult<Location[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: demoStore.getLocations(), isLoading: false, error: null };
    return { data: [] as Location[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function useMovements(limit?: number): QueryResult<StockMovement[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) {
      const data = limit ? demoStore.getRecentMovements(limit) : demoStore.getMovements();
      return { data, isLoading: false, error: null };
    }
    return { data: [] as StockMovement[], isLoading: false, error: null };
  }, [isDemo, demoStore, version, limit]);
}

export function useStockSummary(): QueryResult<StockSummary> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: demoStore.getStockSummary(), isLoading: false, error: null };
    return { data: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }, isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function usePurchaseOrders(): QueryResult<PurchaseOrder[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: [...demoStore.getPurchaseOrders()], isLoading: false, error: null };
    return { data: [] as PurchaseOrder[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function useRequests(): QueryResult<InventoryRequest[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return { data: [...demoStore.getRequests()], isLoading: false, error: null };
    return { data: [] as InventoryRequest[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

import { useCallback, useState } from "react";
import { useDemo } from "@/hooks/useDemo";
import type {
  Item,
  Supplier,
  Location,
  StockMovement,
  PurchaseOrder,
  InventoryRequest,
} from "@/types/inventory";
import type { DemoStore } from "@/lib/demo-store";
import { generateStockAlerts } from "@/lib/notification-generators";

interface MutationResult<TData> {
  mutate: (data: TData, opts?: { onSuccess?: () => void; onError?: (e: Error) => void }) => void;
  isLoading: boolean;
  error: Error | null;
}

function useDemoMutation<TData>(
  handler: (store: DemoStore, data: TData) => void,
): MutationResult<TData> {
  const { isDemo, demoStore, bumpVersion } = useDemo();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    (data: TData, opts?: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
      if (!isDemo || !demoStore) {
        opts?.onError?.(new Error("Not in demo mode"));
        return;
      }
      setIsLoading(true);
      try {
        handler(demoStore, data);
        bumpVersion();
        setError(null);
        opts?.onSuccess?.();
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        opts?.onError?.(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isDemo, demoStore, handler, bumpVersion],
  );

  return { mutate, isLoading, error };
}

export function useCreateItem() {
  return useDemoMutation<Item>((store, data) => store.createItem(data));
}

export function useUpdateItem() {
  return useDemoMutation<{ id: string; updates: Partial<Item> }>((store, { id, updates }) =>
    store.updateItem(id, updates),
  );
}

export function useDeleteItem() {
  return useDemoMutation<string>((store, id) => store.deleteItem(id));
}

export function useCreateMovement() {
  return useDemoMutation<StockMovement>((store, data) => {
    store.createMovement(data);
    generateStockAlerts(store);
  });
}

export function useCreatePurchaseOrder() {
  return useDemoMutation<PurchaseOrder>((store, data) => store.createPurchaseOrder(data));
}

export function useUpdatePurchaseOrder() {
  return useDemoMutation<{ id: string; updates: Partial<PurchaseOrder> }>((store, { id, updates }) =>
    store.updatePurchaseOrder(id, updates),
  );
}

export function useDeletePurchaseOrder() {
  return useDemoMutation<string>((store, id) => store.deletePurchaseOrder(id));
}

export function useCreateSupplier() {
  return useDemoMutation<Supplier>((store, data) => store.createSupplier(data));
}

export function useUpdateSupplier() {
  return useDemoMutation<{ id: string; updates: Partial<Supplier> }>((store, { id, updates }) =>
    store.updateSupplier(id, updates),
  );
}

export function useDeleteSupplier() {
  return useDemoMutation<string>((store, id) => store.deleteSupplier(id));
}

export function useCreateRequest() {
  return useDemoMutation<InventoryRequest>((store, data) => store.createRequest(data));
}

export function useUpdateRequest() {
  return useDemoMutation<{ id: string; updates: Partial<InventoryRequest> }>((store, { id, updates }) =>
    store.updateRequest(id, updates),
  );
}

export function useCreateLocation() {
  return useDemoMutation<Location>((store, data) => store.createLocation(data));
}

export function useUpdateLocation() {
  return useDemoMutation<{ id: string; updates: Partial<Location> }>((store, { id, updates }) =>
    store.updateLocation(id, updates),
  );
}

export function useDeleteLocation() {
  return useDemoMutation<string>((store, id) => store.deleteLocation(id));
}

// ─── Category mutations ─────────────────────────────────
export function useCreateCategory() {
  return useDemoMutation<import("@/types/inventory").Category>((store, data) => store.createCategory(data));
}

export function useUpdateCategory() {
  return useDemoMutation<{ id: string; updates: Partial<import("@/types/inventory").Category> }>((store, { id, updates }) =>
    store.updateCategory(id, updates),
  );
}

export function useDeleteCategory() {
  return useDemoMutation<string>((store, id) => store.deleteCategory(id));
}

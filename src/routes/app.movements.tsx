import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovementsTable } from "@/components/movements/MovementsTable";
import { MovementsFilters } from "@/components/movements/MovementsFilters";
import { MovementStats } from "@/components/movements/MovementStats";
import { MovementFormSheet } from "@/components/movements/MovementFormSheet";
import { CSVExportButton, type CSVColumn } from "@/components/data/CSVExportButton";
import { EMPTY_MOVEMENT_FILTERS } from "@/components/movements/movement-filter-types";
import type { MovementFilters } from "@/components/movements/movement-filter-types";
import { useMovements, useItems, useLocations } from "@/hooks/useInventoryData";
import { PermissionGate } from "@/hooks/usePermissions";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { StockMovement } from "@/types/inventory";

export const Route = createFileRoute("/app/movements")({
  component: MovementsPage,
  head: () => ({ meta: [{ title: "Movements — Stackwise" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    item: typeof search.item === "string" ? search.item : undefined,
  }),
});

function applyFilters(movements: StockMovement[], f: MovementFilters): StockMovement[] {
  let result = movements;
  if (f.types.length > 0) result = result.filter((m) => f.types.includes(m.type));
  if (f.itemId) result = result.filter((m) => m.itemId === f.itemId);
  if (f.performedBy) result = result.filter((m) => m.performedBy === f.performedBy);
  if (f.dateFrom) {
    const from = new Date(f.dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter((m) => new Date(m.createdAt) >= from);
  }
  if (f.dateTo) {
    const to = new Date(f.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((m) => new Date(m.createdAt) <= to);
  }
  return result;
}

function MovementsPage() {
  const { item: itemParam } = Route.useSearch();
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_MOVEMENT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const { data: movements } = useMovements();
  const { data: items } = useItems();
  const { data: locations } = useLocations();

  // Pre-filter by item query param on mount
  useEffect(() => {
    if (itemParam) {
      setFilters((prev) => ({ ...prev, itemId: itemParam }));
    }
  }, [itemParam]);

  const itemNameMap = useMemo(
    () => new Map(items.map((i) => [i.id, i.name])),
    [items],
  );

  const locationNameMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  );

  const performers = useMemo(
    () => [...new Set(movements.map((m) => m.performedBy))].sort(),
    [movements],
  );

  const filtered = useMemo(() => applyFilters(movements, filters), [movements, filters]);

  const movementCsvColumns = useMemo<CSVColumn<StockMovement>[]>(() => [
    { header: "Date", accessor: (m) => new Date(m.createdAt).toLocaleDateString() },
    { header: "Type", accessor: (m) => m.type },
    { header: "Item Name", accessor: (m) => itemNameMap.get(m.itemId) ?? "" },
    { header: "SKU", accessor: (m) => items.find((i) => i.id === m.itemId)?.sku ?? "" },
    { header: "Quantity", accessor: (m) => m.quantity },
    { header: "Performed By", accessor: (m) => m.performedBy },
    { header: "Reference", accessor: (m) => m.reference },
    { header: "Notes", accessor: (m) => m.notes },
  ], [itemNameMap, items]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stock movements</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} movements</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVExportButton
            data={filtered}
            columns={movementCsvColumns}
            filename="stackwise-movements"
          />
          <PermissionGate permission="log_movement">
            <Button onClick={() => setFormOpen(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4" />
              Log Movement
            </Button>
          </PermissionGate>
        </div>
      </div>

      <MovementsFilters
        filters={filters}
        onChange={setFilters}
        items={items}
        performers={performers}
      />

      <MovementStats movements={filtered} />

      <ErrorBoundary>
      {movements.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title="No stock movements recorded"
          description="Movements track stock changes — receipts, shipments, adjustments, and transfers."
          actionLabel="Log Movement"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <MovementsTable movements={filtered} itemNameMap={itemNameMap} locationNameMap={locationNameMap} />
      )}
      </ErrorBoundary>

      <MovementFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        items={items}
        locations={locations}
      />
    </div>
  );
}

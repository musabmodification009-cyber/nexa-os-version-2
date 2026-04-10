import { useMemo } from "react";
import { MapPin, Package, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import type { Item, Location } from "@/types/inventory";
import type { LocationTreeNode } from "@/hooks/useLocations";

const TYPE_LABEL: Record<string, string> = {
  warehouse: "Warehouse",
  zone: "Zone",
  aisle: "Aisle",
  shelf: "Shelf",
  bin: "Bin",
};

interface LocationSummaryProps {
  node: LocationTreeNode;
  allLocations: Location[];
  items: Item[];
}

function getFullPath(locationId: string, locations: Location[]): string {
  const map = new Map(locations.map((l) => [l.id, l]));
  const parts: string[] = [];
  let current = map.get(locationId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return parts.join(" › ");
}

function getDescendantIds(node: LocationTreeNode): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children) {
    ids.push(...getDescendantIds(child));
  }
  return ids;
}

export function LocationSummary({ node, allLocations, items }: LocationSummaryProps) {
  const fullPath = useMemo(() => getFullPath(node.id, allLocations), [node.id, allLocations]);

  const locationIds = useMemo(() => new Set(getDescendantIds(node)), [node]);

  const locationItems = useMemo(
    () => items.filter((i) => i.locationId && locationIds.has(i.locationId)),
    [items, locationIds],
  );

  const totalValue = useMemo(
    () => locationItems.reduce((sum, i) => sum + i.currentStock * i.costPrice, 0),
    [locationItems],
  );

  const top10 = useMemo(() => locationItems.slice(0, 10), [locationItems]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{node.name}</h2>
          <Badge variant="outline" className="text-xs">{TYPE_LABEL[node.type] ?? node.type}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{fullPath}</p>
        {node.description && (
          <p className="mt-1 text-sm text-muted-foreground">{node.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Items
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground">{locationItems.length}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Total Value
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Item list */}
      {locationItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No items stored here</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Top Items {locationItems.length > 10 && `(${locationItems.length} total)`}
          </h3>
          <div className="divide-y divide-border rounded-md border border-border">
            {top10.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{item.currentStock} {item.unit}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
          <a
            href={`/app/catalog?location=${node.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all in catalog
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

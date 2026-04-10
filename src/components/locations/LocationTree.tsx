import { useState, useMemo } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LocationDeleteDialog } from "@/components/locations/LocationDeleteDialog";
import { usePermissions } from "@/hooks/usePermissions";
import type { LocationTreeNode } from "@/hooks/useLocations";
import type { Item } from "@/types/inventory";
import type { LocationType } from "@/types/inventory";

const TYPE_COLOR: Record<LocationType, string> = {
  warehouse: "bg-teal-500/15 text-teal-600 border-teal-500/20",
  zone: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  aisle: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  shelf: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  bin: "bg-muted text-muted-foreground",
};

const TYPE_LABEL: Record<LocationType, string> = {
  warehouse: "Warehouse",
  zone: "Zone",
  aisle: "Aisle",
  shelf: "Shelf",
  bin: "Bin",
};

interface LocationTreeProps {
  tree: LocationTreeNode[];
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function LocationTree({ tree, items, selectedId, onSelect }: LocationTreeProps) {
  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.locationId) {
        counts.set(item.locationId, (counts.get(item.locationId) ?? 0) + 1);
      }
    }
    return counts;
  }, [items]);

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No locations configured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="tree" aria-label="Location hierarchy">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          items={items}
          itemCounts={itemCounts}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  items,
  itemCounts,
  selectedId,
  onSelect,
}: {
  node: LocationTreeNode;
  items: Item[];
  itemCounts: Map<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 1);
  const { can } = usePermissions();
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const count = itemCounts.get(node.id) ?? 0;
  const isAdmin = can("delete_item");

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect(node.id); }}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.stopPropagation(); setExpanded((p) => !p); }
            }}
            className="shrink-0 rounded p-0.5 hover:bg-muted"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                expanded && "rotate-90",
              )}
            />
          </span>
        ) : (
          <span className="w-[18px]" />
        )}

        <span className="flex-1 truncate font-medium">{node.name}</span>

        <Badge variant="outline" className={cn("shrink-0 text-[10px]", TYPE_COLOR[node.type])}>
          {TYPE_LABEL[node.type]}
        </Badge>

        {count > 0 && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {count}
          </span>
        )}

        {isAdmin && (
          <LocationDeleteDialog
            node={node}
            items={items}
            onDeleted={() => {
              if (selectedId === node.id) onSelect("");
            }}
          />
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              items={items}
              itemCounts={itemCounts}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

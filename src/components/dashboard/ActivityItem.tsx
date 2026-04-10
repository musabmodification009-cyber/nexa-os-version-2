import { formatDistanceToNow } from "date-fns";
import { PackageCheck, PackageMinus, PenLine, ArrowLeftRight } from "lucide-react";
import { MovementType, type StockMovement } from "@/types/inventory";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [MovementType.Received]: PackageCheck,
  [MovementType.Shipped]: PackageMinus,
  [MovementType.Adjusted]: PenLine,
  [MovementType.Transferred]: ArrowLeftRight,
};

interface ActivityItemProps {
  movement: StockMovement;
  itemName?: string;
}

export function ActivityItem({ movement, itemName }: ActivityItemProps) {
  const Icon = ICONS[movement.type] ?? ArrowLeftRight;
  const isIn = movement.type === MovementType.Received;
  const qtyPrefix = isIn ? "+" : "-";
  const qtyColor = isIn ? "text-stock-healthy" : "text-stock-out";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {itemName ?? movement.itemId}
      </span>
      <span className={`shrink-0 font-mono text-sm font-medium ${qtyColor}`}>
        {qtyPrefix}{Math.abs(movement.quantity)}
      </span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {movement.performedBy}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
      </span>
    </div>
  );
}

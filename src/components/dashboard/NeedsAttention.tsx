import { Link } from "@tanstack/react-router";
import { useItems, usePurchaseOrders } from "@/hooks/useInventoryData";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle2 } from "lucide-react";

export function NeedsAttention() {
  const { data: items } = useItems();
  const { data: purchaseOrders } = usePurchaseOrders();

  const lowStockItems = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint);
  const outOfStockItems = items.filter((i) => i.currentStock === 0);
  const pendingPOs = purchaseOrders.filter((po) => po.status === "draft" || po.status === "submitted");
  const overduePOs = purchaseOrders.filter(
    (po) => po.expectedDelivery && new Date(po.expectedDelivery) < new Date() && po.status !== "received" && po.status !== "cancelled",
  );

  const hasIssues = lowStockItems.length > 0 || outOfStockItems.length > 0 || pendingPOs.length > 0;

  if (!hasIssues) {
    return (
      <div className="h-full rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="mb-4 text-base font-semibold">Needs attention</h2>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-stock-healthy" />
          <p className="text-sm text-muted-foreground">All clear — inventory is healthy</p>
        </div>
      </div>
    );
  }

  const displayLow = lowStockItems.slice(0, 5);

  return (
    <div className="h-full rounded-xl border border-border bg-card p-6 shadow-xs">
      <h2 className="mb-4 text-base font-semibold">Needs attention</h2>

      {/* Low stock items */}
      {displayLow.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Low stock</p>
            {lowStockItems.length > 5 && (
              <Link to="/app/catalog" className="text-xs font-medium text-primary hover:underline">
                View all ({lowStockItems.length})
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {displayLow.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <StatusBadge status="low-stock" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                <span className="font-mono text-xs font-medium text-stock-low">
                  {item.currentStock}/{item.reorderPoint}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of stock */}
      {outOfStockItems.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Out of stock ({outOfStockItems.length})
          </p>
          <div className="space-y-2">
            {outOfStockItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <StatusBadge status="out-of-stock" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending + Overdue POs */}
      {(pendingPOs.length > 0 || overduePOs.length > 0) && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Purchase orders</p>
          <div className="flex gap-4 text-sm">
            {pendingPOs.length > 0 && (
              <Link to="/app/purchase-orders" className="text-primary hover:underline">
                {pendingPOs.length} pending
              </Link>
            )}
            {overduePOs.length > 0 && (
              <span className="font-medium text-stock-out">{overduePOs.length} overdue</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

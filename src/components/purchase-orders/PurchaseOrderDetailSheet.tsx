import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { Pencil, ExternalLink, Trash2, PackageCheck, Clock, Check, Printer } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "@/types/inventory";
import type { PurchaseOrder, Supplier, Item, StockMovement } from "@/types/inventory";
import { POStatusActions } from "./POStatusActions";
import { cn } from "@/lib/utils";
import { POPrintView } from "./POPrintView";

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "Draft",
  [OrderStatus.Submitted]: "Submitted",
  [OrderStatus.Partial]: "Partially Received",
  [OrderStatus.Received]: "Fully Received",
  [OrderStatus.Cancelled]: "Cancelled",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "bg-muted text-muted-foreground",
  [OrderStatus.Submitted]: "bg-primary/15 text-primary border-primary/20",
  [OrderStatus.Partial]: "bg-amber-accent/15 text-amber-accent border-amber-accent/20",
  [OrderStatus.Received]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [OrderStatus.Cancelled]: "bg-destructive/15 text-destructive border-destructive/20",
};

interface PurchaseOrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  suppliers: Supplier[];
  items: Item[];
  canEdit: boolean;
  isAdmin: boolean;
  onEdit: (po: PurchaseOrder) => void;
  onDelete: (id: string) => void;
  onReceive?: (po: PurchaseOrder) => void;
  movements?: StockMovement[];
}

export function PurchaseOrderDetailSheet({
  open,
  onOpenChange,
  purchaseOrder,
  suppliers,
  items,
  canEdit,
  isAdmin,
  onEdit,
  onDelete,
  onReceive,
  movements = [],
}: PurchaseOrderDetailSheetProps) {
  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  );
  const itemMap = useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  // Filter movements by PO reference (must be before early return)
  const poMovements = useMemo(
    () =>
      purchaseOrder
        ? movements
            .filter((m) => m.reference === purchaseOrder.orderNumber)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [movements, purchaseOrder],
  );

  if (!purchaseOrder) return null;

  const supplier = supplierMap.get(purchaseOrder.supplierId);
  const isDraft = purchaseOrder.status === OrderStatus.Draft;
  const canReceive =
    purchaseOrder.status === OrderStatus.Submitted ||
    purchaseOrder.status === OrderStatus.Partial;
  const showHistory =
    purchaseOrder.status === OrderStatus.Submitted ||
    purchaseOrder.status === OrderStatus.Partial ||
    purchaseOrder.status === OrderStatus.Received;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>{purchaseOrder.orderNumber}</SheetTitle>
          <SheetDescription>Purchase order details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Header info */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={STATUS_CLASS[purchaseOrder.status]}>
              {STATUS_LABEL[purchaseOrder.status]}
            </Badge>
            {isDraft && canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => onEdit(purchaseOrder)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isDraft && isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {purchaseOrder.orderNumber}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete this draft purchase order? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(purchaseOrder.id)}
                    >
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canReceive && canEdit && onReceive && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => onReceive(purchaseOrder)}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Receive Shipment
              </Button>
            )}
            {purchaseOrder.status === OrderStatus.Received && (
              <Badge className="bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20 gap-1">
                <Check className="h-3 w-3" />
                Fully Received
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>

          {/* Supplier link */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Supplier</p>
            {supplier ? (
              <Link
                to="/app/suppliers"
                search={{ supplier: supplier.id }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {supplier.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-sm text-foreground">Unknown</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">
                {format(new Date(purchaseOrder.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected Delivery</p>
              <p className="text-sm text-foreground">
                {purchaseOrder.expectedDelivery
                  ? format(new Date(purchaseOrder.expectedDelivery), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </div>

          {purchaseOrder.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground">{purchaseOrder.notes}</p>
            </div>
          )}

          <Separator />

          {/* Line items */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Line Items ({purchaseOrder.items.length})
            </p>
            <div className="overflow-x-auto rounded-md border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[60px] text-right">Ordered</TableHead>
                    <TableHead className="w-[70px] text-right">Received</TableHead>
                    <TableHead className="w-[70px] text-right">Remaining</TableHead>
                    <TableHead className="w-[100px]">Progress</TableHead>
                    <TableHead className="w-[80px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((li) => {
                    const item = itemMap.get(li.itemId);
                    const pct = li.quantityOrdered > 0
                      ? Math.round((li.quantityReceived / li.quantityOrdered) * 100)
                      : 0;
                    const remaining = Math.max(0, li.quantityOrdered - li.quantityReceived);
                    const barColor =
                      pct === 0
                        ? "bg-muted-foreground/30"
                        : pct >= 100
                          ? "bg-stock-healthy"
                          : "bg-amber-accent";
                    return (
                      <TableRow key={li.id}>
                        <TableCell>
                          <p className={`text-sm font-medium ${!item ? "italic text-muted-foreground/60 line-through" : ""}`}>{item?.name ?? "Deleted Item"}</p>
                          <p className="font-mono text-xs text-muted-foreground">{item?.sku ?? "—"}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {li.quantityOrdered}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {li.quantityReceived}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {remaining}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full transition-all", barColor)}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            {pct >= 100 && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-stock-healthy" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          ${(li.quantityOrdered * li.unitCost).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <span className="text-sm font-medium text-foreground">
              Total:{" "}
              <span className="font-mono text-base">
                ${purchaseOrder.totalCost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>

          <Separator />

          {/* Receiving History */}
          {showHistory && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Receiving History</p>
              {poMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipments received yet.</p>
              ) : (
                <div className="space-y-3">
                  {poMovements.map((m) => {
                    const item = itemMap.get(m.itemId);
                    return (
                      <div key={m.id} className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`font-medium ${!item ? "italic text-muted-foreground/60 line-through" : "text-foreground"}`}>
                              {item?.name ?? "[Item Deleted]"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              +{m.quantity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {m.performedBy} · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                          </p>
                          {m.notes && (
                            <p className="mt-0.5 text-xs text-muted-foreground italic">{m.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Status actions */}
          <POStatusActions purchaseOrder={purchaseOrder} />
        </div>

        <POPrintView
          purchaseOrder={purchaseOrder}
          supplier={supplier}
          items={itemMap}
        />
      </SheetContent>
    </Sheet>
  );
}

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderStatus } from "@/types/inventory";
import type { PurchaseOrder, Supplier } from "@/types/inventory";

const STATUS_STYLE: Record<OrderStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  [OrderStatus.Draft]: { label: "Draft", variant: "secondary" },
  [OrderStatus.Submitted]: { label: "Submitted", variant: "default" },
  [OrderStatus.Partial]: { label: "Partially Received", variant: "outline" },
  [OrderStatus.Received]: { label: "Fully Received", variant: "default" },
  [OrderStatus.Cancelled]: { label: "Cancelled", variant: "destructive" },
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "bg-muted text-muted-foreground",
  [OrderStatus.Submitted]: "bg-primary/15 text-primary border-primary/20",
  [OrderStatus.Partial]: "bg-amber-accent/15 text-amber-accent border-amber-accent/20",
  [OrderStatus.Received]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [OrderStatus.Cancelled]: "bg-destructive/15 text-destructive border-destructive/20",
};

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onRowClick: (po: PurchaseOrder) => void;
}

const PER_PAGE = 20;

export function PurchaseOrdersTable({ purchaseOrders, suppliers, onRowClick }: PurchaseOrdersTableProps) {
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers]);
  const sorted = useMemo(() => [...purchaseOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [purchaseOrders]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const start = safePage * PER_PAGE + 1;
  const end = Math.min((safePage + 1) * PER_PAGE, sorted.length);

  if (sorted.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No purchase orders yet</p>;
  }

  const pagination = sorted.length > PER_PAGE && (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>Showing {start}–{end} of {sorted.length} orders</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Next</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div>
        <div className="space-y-3">
          {paged.map((po) => {
            const statusMeta = STATUS_STYLE[po.status];
            return (
              <Card key={po.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onRowClick(po)}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono font-medium">{po.orderNumber}</CardTitle>
                    <Badge variant={statusMeta.variant} className={STATUS_CLASS[po.status]}>{statusMeta.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span className="truncate ml-2">{supplierMap.get(po.supplierId) ?? "Unknown"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-mono">{po.items.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-mono font-medium">${po.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(po.createdAt), "MMM d, yyyy")}</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {pagination}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-[130px]">PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[80px] text-center">Items</TableHead>
              <TableHead className="w-[120px] text-right">Total Cost</TableHead>
              <TableHead className="w-[130px]">Expected</TableHead>
              <TableHead className="w-[130px]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((po) => {
              const statusMeta = STATUS_STYLE[po.status];
              return (
                <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(po)}>
                  <TableCell className="font-mono text-sm font-medium">{po.orderNumber}</TableCell>
                  <TableCell>{supplierMap.get(po.supplierId) ?? "Unknown"}</TableCell>
                  <TableCell><Badge variant={statusMeta.variant} className={STATUS_CLASS[po.status]}>{statusMeta.label}</Badge></TableCell>
                  <TableCell className="text-center font-mono text-sm">{po.items.length}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">${po.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{po.expectedDelivery ? format(new Date(po.expectedDelivery), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(po.createdAt), "MMM d, yyyy")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {pagination}
    </div>
  );
}

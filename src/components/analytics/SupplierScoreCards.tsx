import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Package, Clock, CheckCircle, Target } from "lucide-react";
import type { PurchaseOrder, Supplier } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";

interface Props {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
}

function rateColor(rate: number) {
  if (rate >= 90) return "text-green-600 dark:text-green-400";
  if (rate >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

interface SupplierMetrics {
  supplier: Supplier;
  totalPOs: number;
  avgLeadTime: number;
  onTimeRate: number;
  fulfillmentAccuracy: number;
}

function computeMetrics(suppliers: Supplier[], pos: PurchaseOrder[]): SupplierMetrics[] {
  return suppliers
    .map((supplier) => {
      const supplierPOs = pos.filter((po) => po.supplierId === supplier.id);
      if (supplierPOs.length === 0) return null;

      const receivedPOs = supplierPOs.filter(
        (po) => po.status === OrderStatus.Received || po.status === OrderStatus.Partial
      );

      // Avg lead time: days between createdAt and updatedAt for received POs
      const leadTimes = receivedPOs.map((po) => {
        const created = new Date(po.createdAt).getTime();
        const updated = new Date(po.updatedAt).getTime();
        return Math.max(1, Math.round((updated - created) / 86400000));
      });
      const avgLeadTime = leadTimes.length > 0 ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;

      // On-time rate: POs received by expected delivery
      const withExpected = receivedPOs.filter((po) => po.expectedDelivery);
      const onTime = withExpected.filter((po) => new Date(po.updatedAt) <= new Date(po.expectedDelivery!));
      const onTimeRate = withExpected.length > 0 ? Math.round((onTime.length / withExpected.length) * 100) : 100;

      // Fulfillment accuracy: % of line items received at ordered qty
      let totalLines = 0;
      let accurateLines = 0;
      receivedPOs.forEach((po) => {
        po.items.forEach((li) => {
          totalLines++;
          if (li.quantityReceived >= li.quantityOrdered) accurateLines++;
        });
      });
      const fulfillmentAccuracy = totalLines > 0 ? Math.round((accurateLines / totalLines) * 100) : 100;

      return { supplier, totalPOs: supplierPOs.length, avgLeadTime, onTimeRate, fulfillmentAccuracy };
    })
    .filter(Boolean) as SupplierMetrics[];
}

export function SupplierScoreCards({ suppliers, purchaseOrders }: Props) {
  const metrics = useMemo(() => computeMetrics(suppliers, purchaseOrders), [suppliers, purchaseOrders]);

  if (metrics.length === 0) {
    return <EmptyState icon={Package} title="No supplier data" description="No suppliers have purchase orders yet." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((m) => (
        <Card key={m.supplier.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{m.supplier.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Package className="h-3.5 w-3.5" /> Total POs</span>
              <span className="font-medium">{m.totalPOs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Avg Lead Time</span>
              <span className="font-medium">{m.avgLeadTime}d</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="h-3.5 w-3.5" /> On-Time Rate</span>
              <span className={`font-medium ${rateColor(m.onTimeRate)}`}>{m.onTimeRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Target className="h-3.5 w-3.5" /> Fulfillment</span>
              <span className={`font-medium ${rateColor(m.fulfillmentAccuracy)}`}>{m.fulfillmentAccuracy}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { computeMetrics, type SupplierMetrics };

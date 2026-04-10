import { format } from "date-fns";
import { OrderStatus } from "@/types/inventory";
import type { PurchaseOrder, Supplier, Item } from "@/types/inventory";

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "Draft",
  [OrderStatus.Submitted]: "Submitted",
  [OrderStatus.Partial]: "Partially Received",
  [OrderStatus.Received]: "Fully Received",
  [OrderStatus.Cancelled]: "Cancelled",
};

interface POPrintViewProps {
  purchaseOrder: PurchaseOrder;
  supplier: Supplier | undefined;
  items: Map<string, Item>;
}

export function POPrintView({ purchaseOrder, supplier, items }: POPrintViewProps) {
  return (
    <div className="po-print-view hidden print:block print:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">Stackwise</h1>
          <p className="text-sm text-gray-600">Purchase Order</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{purchaseOrder.orderNumber}</p>
          <p className="text-sm">Status: {STATUS_LABEL[purchaseOrder.status]}</p>
        </div>
      </div>

      {/* Dates & Supplier */}
      <div className="mb-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Supplier</p>
          <p className="font-medium">{supplier?.name ?? "Unknown"}</p>
          {supplier?.contactName && <p className="text-sm">{supplier.contactName}</p>}
          {supplier?.email && <p className="text-sm">{supplier.email}</p>}
          {supplier?.phone && <p className="text-sm">{supplier.phone}</p>}
          {supplier?.address && <p className="text-sm">{supplier.address}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Dates</p>
          <p className="text-sm">
            Created: {format(new Date(purchaseOrder.createdAt), "MMM d, yyyy")}
          </p>
          {purchaseOrder.expectedDelivery && (
            <p className="text-sm">
              Expected: {format(new Date(purchaseOrder.expectedDelivery), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 text-left">Item</th>
            <th className="py-2 text-left">SKU</th>
            <th className="py-2 text-right">Qty Ordered</th>
            <th className="py-2 text-right">Received</th>
            <th className="py-2 text-right">Unit Cost</th>
            <th className="py-2 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {purchaseOrder.items.map((li) => {
            const item = items.get(li.itemId);
            return (
              <tr key={li.id} className="border-b border-gray-300">
                <td className="py-1.5">{item?.name ?? li.itemId}</td>
                <td className="py-1.5 font-mono text-xs">{item?.sku ?? "—"}</td>
                <td className="py-1.5 text-right font-mono">{li.quantityOrdered}</td>
                <td className="py-1.5 text-right font-mono">{li.quantityReceived}</td>
                <td className="py-1.5 text-right font-mono">${li.unitCost.toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono font-medium">
                  ${(li.quantityOrdered * li.unitCost).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan={5} className="py-2 text-right font-semibold">Total</td>
            <td className="py-2 text-right font-mono font-bold">
              ${purchaseOrder.totalCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {purchaseOrder.notes && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Notes</p>
          <p className="text-sm">{purchaseOrder.notes}</p>
        </div>
      )}

      {/* Receiving Summary */}
      <div className="border-t border-gray-300 pt-3">
        <p className="text-xs font-semibold uppercase text-gray-500">Receiving Summary</p>
        {purchaseOrder.items.map((li) => {
          const item = items.get(li.itemId);
          const pct = li.quantityOrdered > 0
            ? Math.round((li.quantityReceived / li.quantityOrdered) * 100)
            : 0;
          return (
            <p key={li.id} className="text-sm">
              {item?.name ?? li.itemId}: {li.quantityReceived}/{li.quantityOrdered} ({pct}%)
            </p>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-black pt-2 text-center text-xs text-gray-500">
        Printed from Stackwise · {format(new Date(), "MMM d, yyyy h:mm a")}
      </div>
    </div>
  );
}

import { format } from "date-fns";
import { Printer, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SaleTransaction } from "@/types/inventory";

const NAIRA = "₦";

function fmtNgn(amount: number): string {
  return `${NAIRA}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

interface SalesReceiptProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export function SalesReceipt({ sale, onClose }: SalesReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-[380px] rounded-2xl border border-border bg-card shadow-xl">
        {/* Header actions */}
        <div className="flex items-center justify-between px-4 pt-4 print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="receipt-print-area px-6 py-5">
          {/* Store header */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Stackwise Store</h2>
            <p className="text-xs text-muted-foreground">Receipt of Purchase</p>
          </div>

          <Separator className="my-3" />

          {/* Receipt info */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Receipt #</span>
            <span className="font-mono font-medium text-foreground">{sale.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Date</span>
            <span className="font-medium text-foreground">{format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}</span>
          </div>

          {/* Customer info */}
          {sale.customerName && (
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Customer</span>
              <span className="font-medium text-foreground">{sale.customerName}</span>
            </div>
          )}
          {sale.customerPhone && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Phone</span>
              <span className="font-mono text-foreground">{sale.customerPhone}</span>
            </div>
          )}

          <Separator className="my-3" />

          {/* Line items */}
          <div className="space-y-2">
            {sale.items.map((li, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{li.itemName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {li.quantity} × {fmtNgn(li.unitPriceNgn)}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground shrink-0">
                  {fmtNgn(li.unitPriceNgn * li.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="font-mono text-xl font-bold text-foreground">{fmtNgn(sale.totalNgn)}</span>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground">Thank you for your purchase!</p>
            <p className="text-[10px] text-muted-foreground">Powered by Stackwise</p>
          </div>
        </div>
      </div>
    </div>
  );
}

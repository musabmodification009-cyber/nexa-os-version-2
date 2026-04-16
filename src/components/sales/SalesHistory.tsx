import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { CalendarIcon, Receipt, TrendingUp, Printer, MessageCircle, RotateCcw, User, Clock, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDemo } from "@/hooks/useDemo";
import { useRole } from "@/hooks/useRole";
import type { SaleTransaction } from "@/types/inventory";
import { toast } from "sonner";

const NAIRA = "₦";

function fmtNgn(amount: number): string {
  return `${NAIRA}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function SalesHistoryPage() {
  const { demoStore, version, onboarding } = useDemo();
  const { role } = useRole();
  const sales: SaleTransaction[] = useMemo(
    () => demoStore?.getSales() ?? [],
    [demoStore, version],
  );

  const [from, setFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);

  const filtered = useMemo(() => {
    if (!from && !to) return sales;
    return sales.filter((s) => {
      const d = new Date(s.createdAt);
      if (from && to) return isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) });
      if (from) return d >= startOfDay(from);
      if (to) return d <= endOfDay(to);
      return true;
    });
  }, [sales, from, to]);

  const totalRevenue = filtered.reduce((s, t) => s + t.totalNgn, 0);
  const totalTransactions = filtered.length;
  const totalItems = filtered.reduce((s, t) => s + t.items.reduce((a, li) => a + li.quantity, 0), 0);

  const storeName = onboarding.storeName || "NEXA StoreOS";
  const userName = role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Staff";

  const handleSendReceipt = (sale: SaleTransaction) => {
    if (!sale.customerPhone) {
      toast.error("No phone number on this sale. Cannot send receipt.");
      return;
    }
    const lines = [
      `🧾 *${storeName}*`,
      `Receipt #${sale.id.slice(-8).toUpperCase()}`,
      `Date: ${format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}`,
      sale.customerName ? `Customer: ${sale.customerName}` : "",
      "",
      "─────────────────",
      ...sale.items.map((li) => `${li.itemName}\n  ${li.quantity} × ${fmtNgn(li.unitPriceNgn)} = ${fmtNgn(li.unitPriceNgn * li.quantity)}`),
      "─────────────────",
      `*TOTAL: ${fmtNgn(sale.totalNgn)}*`,
      "",
      "Thank you! 🙏",
    ].filter(Boolean).join("\n");
    const phone = sale.customerPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header with date and user */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sales History</h1>
          <p className="text-sm text-muted-foreground">Review past transactions and revenue.</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-sm text-foreground justify-end">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
            <Clock className="h-3 w-3" />
            {format(new Date(), "dd MMM yyyy, HH:mm")}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Total Revenue
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{fmtNgn(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" /> Transactions
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{totalTransactions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" /> Items Sold
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{totalItems}</p>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker label="From" date={from} onSelect={setFrom} />
        <DatePicker label="To" date={to} onSelect={setTo} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setFrom(undefined); setTo(undefined); }}
          className="text-xs text-muted-foreground"
        >
          Clear dates
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No sales found. Complete a sale from the Sales page to see it here.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedSale(sale)}
                >
                  <TableCell className="text-sm">
                    {format(new Date(sale.createdAt), "dd MMM, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{sale.customerName || "Walk-in"}</span>
                      {sale.customerPhone && (
                        <span className="text-[11px] text-muted-foreground font-mono">{sale.customerPhone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PaymentIcon method={(sale as SaleWithPayment).paymentMethod} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {sale.items.reduce((s, li) => s + li.quantity, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {fmtNgn(sale.totalNgn)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sale detail sheet */}
      <Sheet open={!!selectedSale} onOpenChange={(o) => !o && setSelectedSale(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sale Details</SheetTitle>
          </SheetHeader>
          {selectedSale && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Receipt #</span>
                  <span className="font-mono font-medium">{selectedSale.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(selectedSale.createdAt), "dd MMM yyyy, HH:mm")}</span>
                </div>
                {selectedSale.customerName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{selectedSale.customerName}</span>
                  </div>
                )}
                {selectedSale.customerPhone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-mono">{selectedSale.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">{(selectedSale as SaleWithPayment).paymentMethod || "cash"}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Items Purchased</h4>
                {selectedSale.items.map((li, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{li.itemName}</p>
                      <p className="text-[11px] text-muted-foreground">{li.quantity} x {fmtNgn(li.unitPriceNgn)}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold shrink-0">{fmtNgn(li.unitPriceNgn * li.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">{fmtNgn(selectedSale.totalNgn)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleSendReceipt(selectedSale)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {selectedSale.customerPhone ? "Send via WhatsApp" : "No phone (tap to add)"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    toast.info("To return items, go to Returns & Refunds page");
                    setSelectedSale(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Return Items
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Extended type for payment method
interface SaleWithPayment extends SaleTransaction {
  paymentMethod?: "cash" | "transfer" | "card";
}

function PaymentIcon({ method }: { method?: string }) {
  switch (method) {
    case "transfer":
      return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" /> Transfer</span>;
    case "card":
      return <span className="flex items-center gap-1 text-xs text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Card</span>;
    default:
      return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Banknote className="h-3.5 w-3.5" /> Cash</span>;
  }
}

function DatePicker({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMM yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

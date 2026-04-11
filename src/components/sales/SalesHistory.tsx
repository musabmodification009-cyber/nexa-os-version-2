import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { CalendarIcon, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import type { SaleTransaction } from "@/types/inventory";

const NAIRA = "₦";

function fmtNgn(amount: number): string {
  return `${NAIRA}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function SalesHistoryPage() {
  const { demoStore, version } = useDemo();
  const sales: SaleTransaction[] = useMemo(
    () => demoStore?.getSales() ?? [],
    [demoStore, version],
  );

  const [from, setFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [to, setTo] = useState<Date | undefined>(new Date());

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

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sales History</h1>
        <p className="text-sm text-muted-foreground">Review past transactions and revenue.</p>
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
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-sm">
                    {format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}
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
                    <div className="flex flex-col gap-0.5">
                      {sale.items.map((li, idx) => (
                        <span key={idx} className="text-sm">
                          {li.itemName}
                          <span className="text-muted-foreground"> × {li.quantity}</span>
                        </span>
                      ))}
                    </div>
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
    </div>
  );
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

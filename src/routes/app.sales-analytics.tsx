import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Package } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

export const Route = createFileRoute("/app/sales-analytics")({
  component: SalesAnalyticsPage,
  head: () => ({ meta: [{ title: "Sales Analytics — Stackwise" }] }),
});

function fmtN(n: number): string {
  return `${NAIRA}${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function SalesAnalyticsPage() {
  const { demoStore, version } = useDemo();

  const sales = useMemo(() => {
    void version;
    return demoStore?.getSales() ?? [];
  }, [demoStore, version]);

  const expenses = useMemo(() => demoStore?.getExpenses() ?? [], [demoStore, version]);
  const refunds = useMemo(() => demoStore?.getRefunds() ?? [], [demoStore, version]);
  const items = useMemo(() => demoStore?.getItems() ?? [], [demoStore, version]);

  const now = new Date();

  // Helpers
  const isToday = (d: string) => new Date(d).toDateString() === now.toDateString();
  const isThisWeek = (d: string) => now.getTime() - new Date(d).getTime() < 7 * 86400000;
  const isThisMonth = (d: string) => { const dt = new Date(d); return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear(); };

  const todayRev = sales.filter((s) => isToday(s.createdAt)).reduce((a, s) => a + s.totalNgn, 0);
  const weekRev = sales.filter((s) => isThisWeek(s.createdAt)).reduce((a, s) => a + s.totalNgn, 0);
  const monthRev = sales.filter((s) => isThisMonth(s.createdAt)).reduce((a, s) => a + s.totalNgn, 0);
  const allRev = sales.reduce((a, s) => a + s.totalNgn, 0);

  const todayExp = expenses.filter((e) => isToday(e.createdAt)).reduce((a, e) => a + e.amount, 0);
  const weekExp = expenses.filter((e) => isThisWeek(e.createdAt)).reduce((a, e) => a + e.amount, 0);
  const monthExp = expenses.filter((e) => isThisMonth(e.createdAt)).reduce((a, e) => a + e.amount, 0);
  const allExp = expenses.reduce((a, e) => a + e.amount, 0);

  const totalRefunds = refunds.reduce((a, r) => a + r.amountNgn, 0);

  // Profit per item
  const profitByItem = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; cost: number; qty: number }>();
    for (const sale of sales) {
      for (const li of sale.items) {
        const item = items.find((i) => i.id === li.itemId);
        const existing = map.get(li.itemId) ?? { name: li.itemName, revenue: 0, cost: 0, qty: 0 };
        existing.revenue += li.unitPriceNgn * li.quantity;
        existing.cost += (item?.costPrice ?? 0) * USD_TO_NGN * li.quantity;
        existing.qty += li.quantity;
        map.set(li.itemId, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));
  }, [sales, items]);

  // Daily revenue (last 7 days)
  const dailyData = useMemo(() => {
    const days: { label: string; revenue: number; expenses: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const rev = sales.filter((s) => new Date(s.createdAt).toDateString() === ds).reduce((a, s) => a + s.totalNgn, 0);
      const exp = expenses.filter((e) => new Date(e.date).toDateString() === ds).reduce((a, e) => a + e.amount, 0);
      days.push({ label: d.toLocaleDateString("en-NG", { weekday: "short" }), revenue: rev, expenses: exp });
    }
    return days;
  }, [sales, expenses, now]);

  const maxDaily = Math.max(...dailyData.map((d) => Math.max(d.revenue, d.expenses)), 1);

  // Most expensive items (by selling price)
  const expensiveItems = useMemo(() => {
    return [...items].sort((a, b) => b.sellingPrice - a.sellingPrice).slice(0, 10);
  }, [items]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sales Analytics</h1>
        <p className="text-sm text-muted-foreground">Revenue, profit, and expense insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit">Profit per Item</TabsTrigger>
          <TabsTrigger value="expensive">Price Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Today" value={fmtN(todayRev)} icon={Calendar} />
            <SummaryCard label="This Week" value={fmtN(weekRev)} icon={TrendingUp} />
            <SummaryCard label="This Month" value={fmtN(monthRev)} icon={BarChart3} />
            <SummaryCard label="All Time" value={fmtN(allRev)} icon={DollarSign} />
          </div>

          {/* P&L summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profit & Loss Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PnLRow label="Revenue" value={allRev} positive />
                <PnLRow label="Expenses" value={allExp} />
                <PnLRow label="Refunds" value={totalRefunds} />
                <PnLRow label="Net Profit" value={allRev - allExp - totalRefunds} positive={allRev - allExp - totalRefunds > 0} />
              </div>
            </CardContent>
          </Card>

          {/* Daily chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {dailyData.map((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center gap-0.5" style={{ height: 120 }}>
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${(d.revenue / maxDaily) * 100}%`, minHeight: d.revenue > 0 ? 4 : 0 }}
                        title={`Revenue: ${fmtN(d.revenue)}`}
                      />
                      {d.expenses > 0 && (
                        <div
                          className="w-full rounded-t-md bg-destructive/40"
                          style={{ height: `${(d.expenses / maxDaily) * 50}%`, minHeight: 2 }}
                          title={`Expenses: ${fmtN(d.expenses)}`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm bg-primary/80" /> Revenue
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm bg-destructive/40" /> Expenses
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Period Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <PeriodRow label="Today" revenue={todayRev} expenses={todayExp} />
                <PeriodRow label="This Week" revenue={weekRev} expenses={weekExp} />
                <PeriodRow label="This Month" revenue={monthRev} expenses={monthExp} />
                <PeriodRow label="All Time" revenue={allRev} expenses={allExp} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profit per Item</CardTitle>
            </CardHeader>
            <CardContent>
              {profitByItem.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet</p>
              ) : (
                <div className="space-y-2">
                  {profitByItem.slice(0, 15).map((p) => {
                    const profit = p.revenue - p.cost;
                    const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
                    return (
                      <div key={p.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.qty} sold · Revenue: {fmtN(p.revenue)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                            {profit >= 0 ? "+" : ""}{fmtN(profit)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{margin.toFixed(1)}% margin</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expensive" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Most Expensive Items (Selling Price)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expensiveItems.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono">{fmtN(item.sellingPrice * USD_TO_NGN)}</p>
                      <p className="text-[10px] text-muted-foreground">Cost: {fmtN(item.costPrice * USD_TO_NGN)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}

function PnLRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-base font-bold font-mono ${positive ? "text-primary" : value > 0 ? "text-destructive" : "text-foreground"}`}>
        {positive === false || (positive === undefined && value > 0) ? "-" : ""}{fmtN(Math.abs(value))}
      </p>
    </div>
  );
}

function PeriodRow({ label, revenue, expenses }: { label: string; revenue: number; expenses: number }) {
  const profit = revenue - expenses;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="text-primary">{fmtN(revenue)}</span>
        <span className="text-destructive">-{fmtN(expenses)}</span>
        <span className={`font-bold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>= {fmtN(profit)}</span>
      </div>
    </div>
  );
}

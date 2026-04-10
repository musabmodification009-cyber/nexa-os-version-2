import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth } from "date-fns";
import type { PurchaseOrder } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";

interface Props {
  purchaseOrders: PurchaseOrder[];
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export function CostTrendChart({ purchaseOrders }: Props) {
  const [cumulative, setCumulative] = useState(false);

  const data = useMemo(() => {
    const receivedPOs = purchaseOrders.filter(
      (po) => po.status === OrderStatus.Received || po.status === OrderStatus.Partial
    );
    if (receivedPOs.length === 0) return [];

    const monthMap = new Map<string, number>();
    receivedPOs.forEach((po) => {
      const monthKey = format(startOfMonth(new Date(po.updatedAt)), "yyyy-MM");
      const spend = po.items.reduce((s, li) => s + li.quantityReceived * li.unitCost, 0);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + spend);
    });

    const sorted = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    let runningTotal = 0;
    return sorted.map(([month, spend]) => {
      runningTotal += spend;
      return {
        month: format(new Date(month + "-01"), "MMM yyyy"),
        spend: Math.round(spend * 100) / 100,
        cumulative: Math.round(runningTotal * 100) / 100,
      };
    });
  }, [purchaseOrders]);

  if (data.length === 0) {
    return <EmptyState icon={TrendingUp} title="No spending trend" description="No received POs to chart over time." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={cumulative ? "outline" : "default"} onClick={() => setCumulative(false)}>Per Period</Button>
        <Button size="sm" variant={cumulative ? "default" : "outline"} onClick={() => setCumulative(true)}>Cumulative</Button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Line
            type="monotone"
            dataKey={cumulative ? "cumulative" : "spend"}
            className="stroke-primary"
            strokeWidth={2}
            dot={{ r: 4, className: "fill-primary" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

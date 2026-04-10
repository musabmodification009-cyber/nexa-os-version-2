import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";
import { subDays, differenceInDays } from "date-fns";

interface DemandForecastChartProps {
  items: Item[];
  movements: StockMovement[];
}

function buildChartData(item: Item, movements: StockMovement[]) {
  const now = new Date();
  const itemMoves = movements
    .filter((m) => m.itemId === item.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Calculate avg daily consumption from last 90 days
  const cutoff = subDays(now, 90);
  const recentOutbound = itemMoves.filter(
    (m) =>
      (m.type === MovementType.Shipped || (m.type === MovementType.Adjusted && m.quantity < 0)) &&
      new Date(m.createdAt) >= cutoff,
  );
  const totalOut = recentOutbound.reduce((s, m) => s + Math.abs(m.quantity), 0);
  const avgDaily = totalOut / 90;

  // Historical: last 30 days actual stock reconstruction (simplified: current - cumulative out)
  const historicalDays = 30;
  const data: { day: number; actual?: number; projected?: number }[] = [];

  // Reconstruct backwards from current stock
  for (let d = -historicalDays; d <= 0; d++) {
    const date = subDays(now, -d);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Sum movements for days after this day to reconstruct stock
    const futureOut = itemMoves.filter((m) => {
      const mDate = new Date(m.createdAt);
      return mDate > dayEnd && mDate <= now;
    });

    const netFuture = futureOut.reduce((s, m) => {
      if (m.type === MovementType.Received) return s - m.quantity;
      if (m.type === MovementType.Shipped) return s + m.quantity;
      if (m.type === MovementType.Adjusted) return s - m.quantity;
      return s;
    }, 0);

    data.push({ day: d, actual: Math.max(0, item.currentStock + netFuture) });
  }

  // Projection: next 90 days
  let projected = item.currentStock;
  for (let d = 1; d <= 90; d++) {
    projected = Math.max(0, projected - avgDaily);
    data.push({ day: d, projected: Math.round(projected * 10) / 10 });
  }

  // Stockout day
  const stockoutDay = avgDaily > 0 ? Math.ceil(item.currentStock / avgDaily) : null;

  return { data, avgDaily, stockoutDay };
}

export function DemandForecastChart({ items, movements }: DemandForecastChartProps) {
  const activeItems = useMemo(() => items.filter((i) => i.status === "active"), [items]);
  const [selectedId, setSelectedId] = useState<string>(activeItems[0]?.id ?? "");
  const selectedItem = activeItems.find((i) => i.id === selectedId);

  const { data, avgDaily, stockoutDay } = useMemo(() => {
    if (!selectedItem) return { data: [], avgDaily: 0, stockoutDay: null };
    return buildChartData(selectedItem, movements);
  }, [selectedItem, movements]);

  if (activeItems.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-base">Demand Forecast</CardTitle>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {activeItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {stockoutDay !== null && stockoutDay <= 90 && (
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              Projected stockout in {stockoutDay} days
            </Badge>
            <span className="text-xs text-muted-foreground">
              Avg consumption: {avgDaily.toFixed(1)} units/day
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              label={{ value: "Days", position: "insideBottomRight", offset: -5, fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              label={{ value: "Qty", angle: -90, position: "insideLeft", fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              labelFormatter={(v) => `Day ${v}`}
            />

            {/* Threshold zones */}
            {selectedItem && (
              <>
                <ReferenceArea
                  y1={selectedItem.reorderPoint}
                  y2={0}
                  fill="hsl(0 84% 60%)"
                  fillOpacity={0.06}
                />
                <ReferenceLine
                  y={selectedItem.reorderPoint}
                  stroke="hsl(25 95% 53%)"
                  strokeDasharray="4 4"
                  label={{ value: "Reorder Point", fontSize: 10, fill: "hsl(25 95% 53%)" }}
                />
              </>
            )}

            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />

            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

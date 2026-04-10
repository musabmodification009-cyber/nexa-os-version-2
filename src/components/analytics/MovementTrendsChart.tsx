import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfDay, startOfWeek, subDays } from "date-fns";
import type { StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

interface MovementTrendsChartProps {
  movements: StockMovement[];
  days: number;
}

const LINE_COLORS: Record<string, string> = {
  received: "hsl(142, 71%, 45%)",
  shipped: "hsl(220, 70%, 55%)",
  adjusted: "hsl(38, 92%, 50%)",
  transferred: "hsl(280, 60%, 55%)",
};

export function MovementTrendsChart({ movements, days }: MovementTrendsChartProps) {
  const data = useMemo(() => {
    const cutoff = subDays(new Date(), days);
    const filtered = movements.filter((m) => new Date(m.createdAt) >= cutoff);
    const weekly = days > 30;

    const buckets = new Map<string, Record<string, number>>();
    for (const m of filtered) {
      const d = new Date(m.createdAt);
      const key = weekly
        ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(startOfDay(d), "yyyy-MM-dd");
      if (!buckets.has(key)) buckets.set(key, { received: 0, shipped: 0, adjusted: 0, transferred: 0 });
      const b = buckets.get(key)!;
      b[m.type] = (b[m.type] ?? 0) + 1;
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: format(new Date(date), weekly ? "MMM d" : "MMM d"),
        ...counts,
      }));
  }, [movements, days]);

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No movements in this period</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        {Object.entries(LINE_COLORS).map(([key, color]) => (
          <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

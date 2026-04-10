import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Item } from "@/types/inventory";

interface StockStatusChartProps {
  items: Item[];
}

const STATUS_COLORS = ["hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];
const STATUS_LABELS = ["In Stock", "Low Stock", "Out of Stock"];

export function StockStatusChart({ items }: StockStatusChartProps) {
  const data = useMemo(() => {
    const inStock = items.filter((i) => i.currentStock > i.reorderPoint).length;
    const low = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint).length;
    const out = items.filter((i) => i.currentStock === 0).length;
    return [
      { name: "In Stock", value: inStock },
      { name: "Low Stock", value: low },
      { name: "Out of Stock", value: out },
    ].filter((d) => d.value > 0);
  }, [items]);

  const total = items.length;

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No items to display</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry) => {
            const idx = STATUS_LABELS.indexOf(entry.name);
            return <Cell key={entry.name} fill={STATUS_COLORS[idx] ?? STATUS_COLORS[0]} />;
          })}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]} />
        <Legend />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-lg font-bold">{total}</text>
      </PieChart>
    </ResponsiveContainer>
  );
}

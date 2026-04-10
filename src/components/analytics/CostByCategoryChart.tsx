import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers } from "lucide-react";
import type { Item, Category } from "@/types/inventory";

interface Props {
  items: Item[];
  categories: Category[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(180 60% 45%)",
  "hsl(30 80% 55%)",
  "hsl(270 50% 55%)",
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export function CostByCategoryChart({ items, categories }: Props) {
  const { data, total } = useMemo(() => {
    const costMap = new Map<string, number>();
    items.forEach((item) => {
      const key = item.categoryId || "uncategorized";
      costMap.set(key, (costMap.get(key) || 0) + item.currentStock * item.costPrice);
    });
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const data = [...costMap.entries()]
      .map(([id, cost]) => ({ name: catMap.get(id) || "Uncategorized", value: Math.round(cost * 100) / 100 }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    const total = data.reduce((s, d) => s + d.value, 0);
    return { data, total };
  }, [items, categories]);

  if (data.length === 0) {
    return <EmptyState icon={Layers} title="No cost data" description="No categorized items with cost data." />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          paddingAngle={2}
          label={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-xs">Total</text>
        <text x="50%" y="56%" textAnchor="middle" className="fill-foreground text-sm font-semibold">{formatCurrency(total)}</text>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

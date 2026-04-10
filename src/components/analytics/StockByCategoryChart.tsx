import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Item, Category } from "@/types/inventory";

interface StockByCategoryChartProps {
  items: Item[];
  categories: Category[];
}

export function StockByCategoryChart({ items, categories }: StockByCategoryChartProps) {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const countMap = new Map<string, number>();
    items.forEach((i) => { if (i.categoryId) countMap.set(i.categoryId, (countMap.get(i.categoryId) ?? 0) + 1); });
    return categories
      .map((c) => ({ name: c.name, count: countMap.get(c.id) ?? 0, id: c.id }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [items, categories]);

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No category data available</p>;
  }

  const height = Math.max(200, data.length * 40 + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => [value, "Items"]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer"
          onClick={(d: any) => navigate({ to: "/app/catalog", search: { category: d.id } as any })}>
          {data.map((_, i) => (
            <Cell key={i} className="fill-primary" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useStockSummary, useItems, useCategories } from "@/hooks/useInventoryData";

const STATUS_COLORS = [
  "oklch(0.60 0.17 155)", // healthy
  "oklch(0.75 0.15 75)",  // low
  "oklch(0.60 0.22 25)",  // out
];

const CATEGORY_COLORS = [
  "oklch(0.55 0.17 162)",
  "oklch(0.75 0.15 75)",
  "oklch(0.60 0.17 155)",
  "oklch(0.60 0.22 25)",
  "oklch(0.55 0.02 160)",
  "oklch(0.65 0.12 162)",
  "oklch(0.70 0.12 75)",
  "oklch(0.50 0.15 280)",
];

function DonutLabel({ viewBox, total, label }: { viewBox?: { cx: number; cy: number }; total: number; label: string }) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-2xl font-bold font-mono">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">
        {label}
      </text>
    </g>
  );
}

export function StockStatusDonut() {
  const { data: summary } = useStockSummary();

  const data = useMemo(() => [
    { name: "In Stock", value: summary.inStock },
    { name: "Low Stock", value: summary.lowStock },
    { name: "Out of Stock", value: summary.outOfStock },
  ].filter((d) => d.value > 0), [summary]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Stock Status</h3>
      <p className="mb-3 text-xs text-muted-foreground">Current inventory health</p>
      <div className="flex items-center gap-4">
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
                <DonutLabel total={summary.total} label="Total SKUs" viewBox={undefined} />
              </Pie>
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                dataKey="value"
                strokeWidth={0}
                label={({ viewBox }) => <DonutLabel total={summary.total} label="Total SKUs" viewBox={viewBox} />}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} items`, name]}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { label: "In Stock", value: summary.inStock, color: STATUS_COLORS[0] },
            { label: "Low Stock", value: summary.lowStock, color: STATUS_COLORS[1] },
            { label: "Out of Stock", value: summary.outOfStock, color: STATUS_COLORS[2] },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="ml-auto font-mono text-xs font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryDonut() {
  const { data: items } = useItems();
  const { data: categories } = useCategories();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const catName = categories.find((c) => c.id === item.categoryId)?.name ?? "Uncategorized";
      map.set(catName, (map.get(catName) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items, categories]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="mb-1 text-sm font-semibold text-foreground">By Category</h3>
      <p className="mb-3 text-xs text-muted-foreground">Items per product category</p>
      <div className="flex items-center gap-4">
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                dataKey="value"
                strokeWidth={0}
                label={({ viewBox }) => <DonutLabel total={total} label="Products" viewBox={viewBox} />}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} items`, name]}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.slice(0, 6).map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{item.name}</span>
              <span className="ml-auto font-mono text-xs font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

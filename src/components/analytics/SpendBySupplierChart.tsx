import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { DollarSign } from "lucide-react";
import type { PurchaseOrder, Supplier } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";

interface Props {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export function SpendBySupplierChart({ suppliers, purchaseOrders }: Props) {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const receivedPOs = purchaseOrders.filter(
      (po) => po.status === OrderStatus.Received || po.status === OrderStatus.Partial
    );
    const spendMap = new Map<string, number>();
    receivedPOs.forEach((po) => {
      const spend = po.items.reduce((sum, li) => sum + li.quantityReceived * li.unitCost, 0);
      spendMap.set(po.supplierId, (spendMap.get(po.supplierId) || 0) + spend);
    });
    return [...spendMap.entries()]
      .map(([supplierId, spend]) => {
        const supplier = suppliers.find((s) => s.id === supplierId);
        return supplier ? { id: supplierId, name: supplier.name, spend } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.spend - a!.spend) as { id: string; name: string; spend: number }[];
  }, [suppliers, purchaseOrders]);

  if (data.length === 0) {
    return <EmptyState icon={DollarSign} title="No spending data" description="No received purchase orders to analyze." />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Supplier: ${l}`} />
        <Bar
          dataKey="spend"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(entry) => navigate({ to: "/app/suppliers", search: { supplier: entry.id } })}
        >
          {data.map((_, i) => (
            <Cell key={i} className="fill-primary/80 hover:fill-primary" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

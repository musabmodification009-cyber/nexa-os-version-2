import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { subDays } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { useItems, useCategories, useSuppliers, useLocations, useMovements, usePurchaseOrders } from "@/hooks/useInventoryData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { StockSummaryCards } from "@/components/analytics/StockSummaryCards";
import { StockByCategoryChart } from "@/components/analytics/StockByCategoryChart";
import { StockStatusChart } from "@/components/analytics/StockStatusChart";
import { MovementTrendsChart } from "@/components/analytics/MovementTrendsChart";
import { TurnoverAnalysis } from "@/components/analytics/TurnoverAnalysis";
import { AnalyticsFilters, type AnalyticsFilterValues } from "@/components/analytics/AnalyticsFilters";
import { SupplierScoreCards, computeMetrics } from "@/components/analytics/SupplierScoreCards";
import { SpendBySupplierChart } from "@/components/analytics/SpendBySupplierChart";
import { CostByCategoryChart } from "@/components/analytics/CostByCategoryChart";
import { CostTrendChart } from "@/components/analytics/CostTrendChart";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Stackwise" }] }),
});

function AnalyticsPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!can("view_analytics")) {
      toast.error("Access denied");
      navigate({ to: "/app/dashboard" });
    }
  }, [can, navigate]);

  const [tab, setTab] = useState("stock");
  const [filters, setFilters] = useState<AnalyticsFilterValues>({ categoryId: null, supplierId: null, locationId: null, days: 30 });
  const [stockOpen, setStockOpen] = useState(true);
  const [movementOpen, setMovementOpen] = useState(true);
  const [turnoverOpen, setTurnoverOpen] = useState(true);

  const { data: allItems } = useItems();
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const { data: allMovements } = useMovements();
  const { data: purchaseOrders } = usePurchaseOrders();

  const items = useMemo(() => {
    let result = allItems;
    if (filters.categoryId) result = result.filter((i) => i.categoryId === filters.categoryId);
    if (filters.supplierId) result = result.filter((i) => i.supplierId === filters.supplierId);
    if (filters.locationId) result = result.filter((i) => i.locationId === filters.locationId);
    return result;
  }, [allItems, filters]);

  const movements = useMemo(() => {
    const cutoff = subDays(new Date(), filters.days);
    let result = allMovements.filter((m) => new Date(m.createdAt) >= cutoff);
    if (filters.categoryId || filters.supplierId || filters.locationId) {
      const itemIds = new Set(items.map((i) => i.id));
      result = result.filter((m) => itemIds.has(m.itemId));
    }
    return result;
  }, [allMovements, items, filters]);

  const handleExportStock = () => {
    if (items.length === 0 && movements.length === 0) { toast.error("No data to export"); return; }
    const rows: string[] = ["Section,Name,SKU,Qty,Cost,Value,Status"];
    items.forEach((i) => rows.push(`Stock,${i.name},${i.sku},${i.currentStock},${i.costPrice},${(i.currentStock * i.costPrice).toFixed(2)},${i.status}`));
    rows.push("", "Section,Date,Item,Type,Qty,Reference");
    movements.forEach((m) => rows.push(`Movement,${m.createdAt},${m.itemId},${m.type},${m.quantity},${m.reference}`));
    downloadCsv(rows.join("\n"), "stackwise-analytics");
  };

  const handleExportSupplier = () => {
    const metrics = computeMetrics(suppliers, purchaseOrders);
    if (metrics.length === 0) { toast.error("No data to export"); return; }
    const rows: string[] = ["Section,Name,Total POs,Avg Lead Time (days),On-Time Rate (%),Fulfillment Accuracy (%)"];
    metrics.forEach((m) => rows.push(`Supplier,${m.supplier.name},${m.totalPOs},${m.avgLeadTime},${m.onTimeRate},${m.fulfillmentAccuracy}`));
    rows.push("", "Section,Category,Cost");
    const costMap = new Map<string, number>();
    items.forEach((item) => {
      const catName = categories.find((c) => c.id === item.categoryId)?.name || "Uncategorized";
      costMap.set(catName, (costMap.get(catName) || 0) + item.currentStock * item.costPrice);
    });
    [...costMap.entries()].sort((a, b) => b[1] - a[1]).forEach(([name, cost]) => rows.push(`Category Cost,${name},${cost.toFixed(2)}`));
    downloadCsv(rows.join("\n"), "stackwise-supplier-report");
  };

  if (!can("view_analytics")) return null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Stock, movement & supplier reports</p>
        </div>
        <Button size="sm" variant="outline" onClick={tab === "suppliers" ? handleExportSupplier : handleExportStock}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="stock">Stock Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <AnalyticsFilters filters={filters} onChange={setFilters} categories={categories} suppliers={suppliers} locations={locations} />
        </div>

        <TabsContent value="stock" className="space-y-6 mt-4">
          <ErrorBoundary><StockSummaryCards items={items} /></ErrorBoundary>

          <Collapsible open={stockOpen} onOpenChange={setStockOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardTitle className="text-base">Stock Overview</CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <ErrorBoundary>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Items by Category</h3>
                        <StockByCategoryChart items={items} categories={categories} />
                      </div>
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Stock Status Distribution</h3>
                        <StockStatusChart items={items} />
                      </div>
                    </div>
                  </ErrorBoundary>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={movementOpen} onOpenChange={setMovementOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardTitle className="text-base">Movement Trends</CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <ErrorBoundary><MovementTrendsChart movements={movements} days={filters.days} /></ErrorBoundary>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={turnoverOpen} onOpenChange={setTurnoverOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardTitle className="text-base">Turnover & Reorder Analysis</CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <ErrorBoundary><TurnoverAnalysis items={items} movements={movements} /></ErrorBoundary>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6 mt-4">
          <ErrorBoundary>
            <Card>
              <CardHeader><CardTitle className="text-base">Supplier Performance</CardTitle></CardHeader>
              <CardContent>
                <SupplierScoreCards suppliers={suppliers} purchaseOrders={purchaseOrders} />
              </CardContent>
            </Card>
          </ErrorBoundary>

          <div className="grid gap-6 lg:grid-cols-2">
            <ErrorBoundary>
              <Card>
                <CardHeader><CardTitle className="text-base">Spending by Supplier</CardTitle></CardHeader>
                <CardContent>
                  <SpendBySupplierChart suppliers={suppliers} purchaseOrders={purchaseOrders} />
                </CardContent>
              </Card>
            </ErrorBoundary>

            <ErrorBoundary>
              <Card>
                <CardHeader><CardTitle className="text-base">Cost by Category</CardTitle></CardHeader>
                <CardContent>
                  <CostByCategoryChart items={items} categories={categories} />
                </CardContent>
              </Card>
            </ErrorBoundary>
          </div>

          <ErrorBoundary>
            <Card>
              <CardHeader><CardTitle className="text-base">Cost Trend Over Time</CardTitle></CardHeader>
              <CardContent>
                <CostTrendChart purchaseOrders={purchaseOrders} />
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function downloadCsv(content: string, prefix: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Report exported");
}

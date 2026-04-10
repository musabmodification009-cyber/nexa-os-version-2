import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ForecastSummary } from "@/components/insights/ForecastSummary";
import { DemandForecastChart } from "@/components/insights/DemandForecastChart";
import { ReorderSuggestionCard } from "@/components/insights/ReorderSuggestionCard";
import { AnomalyAlertCard } from "@/components/insights/AnomalyAlertCard";
import { useDemo } from "@/hooks/useDemo";
import { useUpdateItem } from "@/hooks/useInventoryMutations";
import { analyzeAllItems, type ReorderAnalysis } from "@/lib/reorder-engine";
import { analyzeMovements, type AnomalySeverity, type AnomalyType } from "@/lib/anomaly-engine";
import { usePermissions } from "@/hooks/usePermissions";
import { subDays } from "date-fns";

export const Route = createFileRoute("/app/ai-insights")({
  component: AiInsightsPage,
  head: () => ({
    meta: [{ title: "Insights — Stackwise" }],
  }),
});

type UrgencyFilter = "all" | "critical" | "moderate" | "low";
type ConfidenceFilter = "all" | "high" | "medium" | "low";
type SortBy = "stockout" | "delta";
type AnomalySeverityFilter = "all" | "warning" | "critical";
type AnomalyTypeFilter = "all" | "quantity_spike" | "frequent_adjustments" | "unusual_timing";

function AiInsightsPage() {
  const { demoStore } = useDemo();
  const { can } = usePermissions();
  const updateItem = useUpdateItem();

  const [urgency, setUrgency] = useState<UrgencyFilter>("all");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("stockout");
  const [anomSeverity, setAnomSeverity] = useState<AnomalySeverityFilter>("all");
  const [anomType, setAnomType] = useState<AnomalyTypeFilter>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];
  const suppliers = demoStore?.getSuppliers() ?? [];

  const allAnalyses = useMemo(
    () => analyzeAllItems(items, movements, suppliers),
    [items, movements, suppliers],
  );

  // Anomaly detection
  const allAnomalies = useMemo(() => {
    const cutoff = subDays(new Date(), 90);
    const recent = movements.filter((m) => new Date(m.createdAt) >= cutoff);
    return analyzeMovements(recent);
  }, [movements]);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const filteredAnomalies = useMemo(() => {
    let result = [...allAnomalies];
    if (!showDismissed) result = result.filter((a) => !dismissedIds.has(`${a.type}-${a.movementId}`));
    if (anomSeverity !== "all") result = result.filter((a) => a.severity === anomSeverity);
    if (anomType !== "all") result = result.filter((a) => a.type === anomType);
    return result;
  }, [allAnomalies, anomSeverity, anomType, showDismissed, dismissedIds]);

  const filtered = useMemo(() => {
    let result = [...allAnalyses];

    if (urgency !== "all") {
      result = result.filter((a) => {
        if (a.daysUntilStockout === null) return urgency === "low";
        if (a.daysUntilStockout < 7) return urgency === "critical";
        if (a.daysUntilStockout <= 14) return urgency === "moderate";
        return urgency === "low";
      });
    }

    if (confidence !== "all") {
      result = result.filter((a) => a.confidence === confidence);
    }

    if (sortBy === "delta") {
      result.sort(
        (a, b) =>
          Math.abs(b.suggestedReorderPoint - b.currentReorderPoint) -
          Math.abs(a.suggestedReorderPoint - a.currentReorderPoint),
      );
    }
    // default sort is already by stockout from analyzeAllItems

    return result;
  }, [allAnalyses, urgency, confidence, sortBy]);

  if (!can("view_analytics")) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const handleApply = (a: ReorderAnalysis) => {
    updateItem.mutate(
      { id: a.itemId, updates: { reorderPoint: a.suggestedReorderPoint, reorderQuantity: a.suggestedReorderQuantity } },
      {
        onSuccess: () => toast.success(`Reorder settings updated for ${a.itemName}`),
        onError: (e) => toast.error(e.message || "Failed to update reorder settings."),
      },
    );
  };

  const handleDismiss = (_a: ReorderAnalysis) => {};

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">AI insights</h1>
        <Badge variant="secondary" className="text-xs">Beta</Badge>
      </div>

      {/* Summary Metrics */}
      <ForecastSummary analyses={allAnalyses} />

      {/* Demand Chart */}
      <DemandForecastChart items={items} movements={movements} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical (&lt;7d)</SelectItem>
            <SelectItem value="moderate">Moderate (7-14d)</SelectItem>
            <SelectItem value="low">Low (&gt;14d)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={confidence} onValueChange={(v) => setConfidence(v as ConfidenceFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stockout">Days to Stockout</SelectItem>
            <SelectItem value="delta">Order delta</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Suggestion Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No suggested orders match the current filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ReorderSuggestionCard
              key={a.itemId}
              analysis={a}
              onApply={handleApply}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Anomalies Section */}
      <div id="anomalies" className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-semibold">Anomaly Detection</h2>
          <Badge variant="destructive" className="text-xs">{allAnomalies.length}</Badge>
        </div>

        {/* Anomaly summary */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Total: {allAnomalies.length}</span>
          <span>Critical: {allAnomalies.filter((a) => a.severity === "critical").length}</span>
          {allAnomalies.length > 0 && (() => {
            const counts = new Map<string, number>();
            allAnomalies.forEach((a) => counts.set(a.itemId, (counts.get(a.itemId) ?? 0) + 1));
            const [topId, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
            const topItem = itemMap.get(topId);
            return topItem ? <span>Most affected: {topItem.name} ({topCount})</span> : null;
          })()}
        </div>

        {/* Anomaly filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={anomSeverity} onValueChange={(v) => setAnomSeverity(v as AnomalySeverityFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={anomType} onValueChange={(v) => setAnomType(v as AnomalyTypeFilter)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quantity_spike">Quantity Spike</SelectItem>
              <SelectItem value="frequent_adjustments">Frequent Adjustments</SelectItem>
              <SelectItem value="unusual_timing">Unusual Timing</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="show-dismissed"
              checked={showDismissed}
              onCheckedChange={setShowDismissed}
            />
            <Label htmlFor="show-dismissed" className="text-xs">Show Dismissed</Label>
          </div>
        </div>

        {filteredAnomalies.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No anomalies match the current filters.
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredAnomalies.map((a) => {
              const item = itemMap.get(a.itemId);
              return (
                <AnomalyAlertCard
                  key={`${a.type}-${a.movementId}`}
                  alert={a}
                  itemName={item?.name}
                  itemSku={item?.sku}
                  onDismiss={(alert) => {
                    setDismissedIds((prev) => new Set([...prev, `${alert.type}-${alert.movementId}`]));
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

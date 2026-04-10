import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReorderSuggestionCard } from "@/components/insights/ReorderSuggestionCard";
import { useUpdateItem } from "@/hooks/useInventoryMutations";
import { toast } from "sonner";
import type { Item, StockMovement, Supplier } from "@/types/inventory";
import { analyzeAllItems, type ReorderAnalysis } from "@/lib/reorder-engine";

interface DashboardReorderSectionProps {
  items: Item[];
  movements: StockMovement[];
  suppliers: Supplier[];
}

export function DashboardReorderSection({ items, movements, suppliers }: DashboardReorderSectionProps) {
  const updateItem = useUpdateItem();

  const suggestions = useMemo(() => {
    const all = analyzeAllItems(items, movements, suppliers);
    return all.filter(
      (a) =>
        Math.abs(a.suggestedReorderPoint - a.currentReorderPoint) / Math.max(a.currentReorderPoint, 1) > 0.15 ||
        (a.daysUntilStockout !== null && a.daysUntilStockout < 30),
    );
  }, [items, movements, suppliers]);

  const top5 = suggestions.slice(0, 5);

  if (top5.length === 0) return null;

  const handleApply = (a: ReorderAnalysis) => {
    updateItem.mutate(
      { id: a.itemId, updates: { reorderPoint: a.suggestedReorderPoint, reorderQuantity: a.suggestedReorderQuantity } },
      {
        onSuccess: () => toast.success(`Reorder settings updated for ${a.itemName}`),
        onError: (e) => toast.error(e.message || "Failed to update reorder settings."),
      },
    );
  };

  const handleDismiss = (_a: ReorderAnalysis) => {
    // Just hides the card via internal state
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Suggested orders</h2>
          <Badge variant="secondary" className="text-xs">{suggestions.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link to="/app/ai-insights">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top5.map((a) => (
          <ReorderSuggestionCard
            key={a.itemId}
            analysis={a}
            onApply={handleApply}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </section>
  );
}

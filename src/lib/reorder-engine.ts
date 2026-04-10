import type { Item, StockMovement, Supplier } from "@/types/inventory";
import { MovementType } from "@/types/inventory";
import { differenceInDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ReorderAnalysis {
  itemId: string;
  itemName: string;
  sku: string;
  currentStock: number;
  currentReorderPoint: number;
  currentReorderQuantity: number;
  suggestedReorderPoint: number;
  suggestedReorderQuantity: number;
  avgDailyConsumption: number;
  daysUntilStockout: number | null; // null = no consumption
  confidence: ConfidenceLevel;
  leadTimeDays: number;
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Compute daily consumption values from outbound movements over the
 * given window (default 90 days). Returns an array of per-day totals
 * for days that had any outbound activity. Days with no activity are
 * included as 0 to get accurate averages.
 */
function getDailyConsumption(
  movements: StockMovement[],
  windowDays = 90,
): number[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * 86_400_000);

  // Only outbound movements count as consumption
  const outbound = movements.filter(
    (m) =>
      (m.type === MovementType.Shipped || (m.type === MovementType.Adjusted && m.quantity < 0)) &&
      new Date(m.createdAt) >= cutoff,
  );

  // Bucket by day offset
  const buckets = new Map<number, number>();
  for (let d = 0; d < windowDays; d++) buckets.set(d, 0);

  for (const m of outbound) {
    const dayOffset = Math.min(
      windowDays - 1,
      Math.max(0, differenceInDays(now, new Date(m.createdAt))),
    );
    buckets.set(dayOffset, (buckets.get(dayOffset) ?? 0) + Math.abs(m.quantity));
  }

  return Array.from(buckets.values());
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const sqDiffs = arr.map((v) => (v - avg) ** 2);
  return Math.sqrt(mean(sqDiffs));
}

// ─── Core calculations ──────────────────────────────────

/**
 * Calculate suggested reorder point:
 *   avgDailyConsumption × leadTimeDays + safetyStock
 * where safetyStock = 1.5 × stdDev(dailyConsumption) × √leadTimeDays
 */
export function calculateReorderPoint(
  movements: StockMovement[],
  leadTimeDays: number,
): number {
  const daily = getDailyConsumption(movements);
  const avg = mean(daily);
  const sd = stdDev(daily);
  const safetyStock = 1.5 * sd * Math.sqrt(Math.max(leadTimeDays, 1));
  return Math.ceil(avg * leadTimeDays + safetyStock);
}

/**
 * Economic order quantity approximation:
 *   avgDailyConsumption × (leadTimeDays + orderFrequencyDays)
 * Minimum of 1.
 */
export function calculateReorderQuantity(
  avgDailyConsumption: number,
  leadTimeDays: number,
  orderFrequencyDays = 30,
): number {
  if (avgDailyConsumption <= 0) return 1;
  return Math.max(1, Math.ceil(avgDailyConsumption * (leadTimeDays + orderFrequencyDays)));
}

/**
 * Determine confidence based on history length.
 */
function getConfidence(movements: StockMovement[]): ConfidenceLevel {
  if (movements.length === 0) return "low";
  const oldest = new Date(
    Math.min(...movements.map((m) => new Date(m.createdAt).getTime())),
  );
  const historyDays = differenceInDays(new Date(), oldest);
  if (historyDays >= 60) return "high";
  if (historyDays >= 30) return "medium";
  return "low";
}

/**
 * Full analysis for a single item.
 */
export function analyzeItem(
  item: Item,
  movements: StockMovement[],
  supplier: Supplier | null | undefined,
): ReorderAnalysis {
  const itemMovements = movements.filter((m) => m.itemId === item.id);
  const leadTimeDays = supplier?.leadTimeDays ?? 7;

  const daily = getDailyConsumption(itemMovements);
  const avgDailyConsumption = mean(daily);

  const suggestedReorderPoint = calculateReorderPoint(itemMovements, leadTimeDays);
  const suggestedReorderQuantity = calculateReorderQuantity(
    avgDailyConsumption,
    leadTimeDays,
  );

  const daysUntilStockout =
    avgDailyConsumption > 0
      ? Math.max(0, Math.floor(item.currentStock / avgDailyConsumption))
      : null;

  return {
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    currentStock: item.currentStock,
    currentReorderPoint: item.reorderPoint,
    currentReorderQuantity: item.reorderQuantity,
    suggestedReorderPoint,
    suggestedReorderQuantity,
    avgDailyConsumption,
    daysUntilStockout,
    confidence: getConfidence(itemMovements),
    leadTimeDays,
  };
}

/**
 * Analyze all active items and return suggestions where current settings
 * differ meaningfully from suggested values.
 */
export function analyzeAllItems(
  items: Item[],
  movements: StockMovement[],
  suppliers: Supplier[],
): ReorderAnalysis[] {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  return items
    .filter((i) => i.status === "active")
    .map((item) => analyzeItem(item, movements, supplierMap.get(item.supplierId ?? "")))
    .sort((a, b) => {
      // Most urgent first (lowest daysUntilStockout)
      const aD = a.daysUntilStockout ?? Infinity;
      const bD = b.daysUntilStockout ?? Infinity;
      return aD - bD;
    });
}

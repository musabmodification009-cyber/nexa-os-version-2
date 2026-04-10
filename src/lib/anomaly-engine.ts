import type { StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";
import { differenceInDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────

export type AnomalySeverity = "warning" | "critical";
export type AnomalyType = "quantity_spike" | "frequent_adjustments" | "unusual_timing";

export interface AnomalyAlert {
  movementId: string;
  itemId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: string;
}

// ─── Detection functions ─────────────────────────────────

const MIN_HISTORY = 5;

/**
 * Flags if movement quantity > 3× the item's average movement quantity.
 */
export function detectQuantitySpike(
  movement: StockMovement,
  itemHistory: StockMovement[],
): AnomalyAlert | null {
  if (itemHistory.length < MIN_HISTORY) return null;

  const avg =
    itemHistory.reduce((s, m) => s + Math.abs(m.quantity), 0) / itemHistory.length;
  const qty = Math.abs(movement.quantity);

  if (avg === 0 || qty <= avg * 3) return null;

  const ratio = (qty / avg).toFixed(1);
  const isCritical = qty > avg * 5;

  return {
    movementId: movement.id,
    itemId: movement.itemId,
    type: "quantity_spike",
    severity: isCritical ? "critical" : "warning",
    title: `Quantity spike: ${qty} units`,
    description: `This movement of ${qty} units is ${ratio}× the average of ${Math.round(avg)} units for this item.`,
    detectedAt: movement.createdAt,
  };
}

/**
 * Flags if >3 adjustments for the same item within windowDays.
 */
export function detectFrequentAdjustments(
  itemMovements: StockMovement[],
  windowDays = 7,
): AnomalyAlert | null {
  if (itemMovements.length < MIN_HISTORY) return null;

  const now = new Date();
  const adjustments = itemMovements.filter(
    (m) =>
      m.type === MovementType.Adjusted &&
      differenceInDays(now, new Date(m.createdAt)) <= windowDays,
  );

  if (adjustments.length <= 3) return null;

  const latest = adjustments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return {
    movementId: latest.id,
    itemId: latest.itemId,
    type: "frequent_adjustments",
    severity: adjustments.length > 5 ? "critical" : "warning",
    title: `${adjustments.length} adjustments in ${windowDays} days`,
    description: `This item has been adjusted ${adjustments.length} times in the last ${windowDays} days, which may indicate counting issues or process problems.`,
    detectedAt: latest.createdAt,
  };
}

/**
 * Flags movements on weekends when all prior history is weekday-only.
 */
export function detectUnusualTiming(
  movement: StockMovement,
  itemHistory: StockMovement[],
): AnomalyAlert | null {
  if (itemHistory.length < MIN_HISTORY) return null;

  const movDay = new Date(movement.createdAt).getDay();
  const isWeekend = movDay === 0 || movDay === 6;
  if (!isWeekend) return null;

  const weekendHistory = itemHistory.filter((m) => {
    const d = new Date(m.createdAt).getDay();
    return d === 0 || d === 6;
  });

  // If <10% of history is on weekends, flag this
  if (weekendHistory.length / itemHistory.length < 0.1) {
    return {
      movementId: movement.id,
      itemId: movement.itemId,
      type: "unusual_timing",
      severity: "warning",
      title: "Unusual weekend activity",
      description: `This movement occurred on a weekend, while only ${weekendHistory.length} of ${itemHistory.length} prior movements were on weekends.`,
      detectedAt: movement.createdAt,
    };
  }

  return null;
}

/**
 * Analyze all movements and return detected anomalies.
 */
export function analyzeMovements(movements: StockMovement[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const seen = new Set<string>();

  // Group by item
  const byItem = new Map<string, StockMovement[]>();
  for (const m of movements) {
    const arr = byItem.get(m.itemId) ?? [];
    arr.push(m);
    byItem.set(m.itemId, arr);
  }

  for (const [itemId, itemMoves] of byItem) {
    // Sort by date
    const sorted = [...itemMoves].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Check each movement for spikes and timing
    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      const prior = sorted.slice(0, i);

      const spike = detectQuantitySpike(m, prior);
      if (spike && !seen.has(`spike-${m.id}`)) {
        alerts.push(spike);
        seen.add(`spike-${m.id}`);
      }

      const timing = detectUnusualTiming(m, prior);
      if (timing && !seen.has(`timing-${m.id}`)) {
        alerts.push(timing);
        seen.add(`timing-${m.id}`);
      }
    }

    // Check frequent adjustments per item
    const freq = detectFrequentAdjustments(sorted);
    if (freq && !seen.has(`freq-${itemId}`)) {
      alerts.push(freq);
      seen.add(`freq-${itemId}`);
    }
  }

  // Sort by severity (critical first), then by date (newest first)
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });
}

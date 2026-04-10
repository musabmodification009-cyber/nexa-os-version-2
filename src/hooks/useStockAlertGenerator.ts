import { useEffect, useRef } from "react";
import { useDemo } from "@/hooks/useDemo";
import { generateStockAlerts, generatePOAlerts } from "@/lib/notification-generators";

/**
 * Runs stock + PO alert generation once on mount (dashboard load).
 * Bumps version so notification hooks re-render.
 */
export function useAlertGenerator() {
  const { isDemo, demoStore, bumpVersion } = useDemo();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isDemo || !demoStore || ranRef.current) return;
    ranRef.current = true;
    generateStockAlerts(demoStore);
    generatePOAlerts(demoStore);
    bumpVersion();
  }, [isDemo, demoStore, bumpVersion]);
}

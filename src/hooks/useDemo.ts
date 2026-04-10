import { useContext } from "react";
import { DemoContext, type DemoContextValue } from "@/contexts/DemoContext";

/**
 * Convenience hook for DemoContext.
 * Throws if used outside <DemoProvider>.
 */
export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within a <DemoProvider>. Wrap your app in <DemoProvider>.");
  }
  return ctx;
}

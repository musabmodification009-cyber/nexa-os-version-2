import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { DemoStore } from "@/lib/demo-store";

export interface DemoContextValue {
  isDemo: boolean;
  demoStore: DemoStore | null;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  resetDemoData: () => void;
  /** Increment after any store mutation to trigger re-renders */
  bumpVersion: () => void;
  version: number;
}

export const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const [version, setVersion] = useState(0);

  const enterDemoMode = useCallback(() => {
    const s = new DemoStore();
    setStore(s);
    setVersion(0);
  }, []);

  const exitDemoMode = useCallback(() => {
    setStore(null);
    setVersion(0);
  }, []);

  const resetDemoData = useCallback(() => {
    if (store) {
      store.reset();
      setVersion((v) => v + 1);
    }
  }, [store]);

  const bumpVersion = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo<DemoContextValue>(
    () => ({
      isDemo: store !== null,
      demoStore: store,
      enterDemoMode,
      exitDemoMode,
      resetDemoData,
      bumpVersion,
      version,
    }),
    [store, enterDemoMode, exitDemoMode, resetDemoData, bumpVersion, version],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

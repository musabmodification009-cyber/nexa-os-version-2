import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { DemoStore } from "@/lib/demo-store";

export interface OnboardingSelection {
  businessType: string | null;
  categories: string[];
}

const DEFAULT_ONBOARDING: OnboardingSelection = { businessType: null, categories: [] };

export interface DemoContextValue {
  isDemo: boolean;
  demoStore: DemoStore | null;
  enterDemoMode: (onboarding?: OnboardingSelection) => void;
  exitDemoMode: () => void;
  resetDemoData: () => void;
  bumpVersion: () => void;
  version: number;
  onboarding: OnboardingSelection;
}

export const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const [version, setVersion] = useState(0);
  const [onboarding, setOnboarding] = useState<OnboardingSelection>(DEFAULT_ONBOARDING);

  const enterDemoMode = useCallback((ob?: OnboardingSelection) => {
    const s = new DemoStore();
    setStore(s);
    setVersion(0);
    setOnboarding(ob ?? DEFAULT_ONBOARDING);
  }, []);

  const exitDemoMode = useCallback(() => {
    setStore(null);
    setVersion(0);
    setOnboarding(DEFAULT_ONBOARDING);
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
      onboarding,
    }),
    [store, enterDemoMode, exitDemoMode, resetDemoData, bumpVersion, version, onboarding],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

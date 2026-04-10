import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "stackwise-onboarding-complete";

export interface TourStep {
  target?: string; // data-tour attribute value
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function useOnboarding(tourId: string) {
  const key = `${STORAGE_KEY}-${tourId}`;
  const [hasCompleted, setHasCompleted] = useState(() => localStorage.getItem(key) === "true");
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback(() => {
    if (!hasCompleted) {
      setCurrentStep(0);
      setIsActive(true);
    }
  }, [hasCompleted]);

  const skipTour = useCallback(() => {
    localStorage.setItem(key, "true");
    setHasCompleted(true);
    setIsActive(false);
  }, [key]);

  const completeTour = useCallback(() => {
    localStorage.setItem(key, "true");
    setHasCompleted(true);
    setIsActive(false);
  }, [key]);

  const next = useCallback(() => setCurrentStep((s) => s + 1), []);
  const back = useCallback(() => setCurrentStep((s) => Math.max(0, s - 1)), []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(key);
    setHasCompleted(false);
    setIsActive(false);
    setCurrentStep(0);
  }, [key]);

  return { hasCompleted, currentStep, isActive, startTour, skipTour, completeTour, next, back, resetTour };
}

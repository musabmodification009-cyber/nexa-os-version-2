import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/hooks/useOnboarding";

interface Props {
  steps: TourStep[];
  currentStep: number;
  isActive: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ steps, currentStep, isActive, onNext, onBack, onSkip, onComplete }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const hasTarget = !!step?.target;

  useEffect(() => {
    if (!isActive || !step?.target) { setPos(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) { setPos(null); return; }
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });

    // Boost target element above backdrop
    el.style.position = el.style.position || "relative";
    el.style.zIndex = "10002";
    return () => {
      el.style.zIndex = "";
    };
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const handleNext = () => {
    if (isLast) onComplete();
    else onNext();
  };

  // Smart tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget || !pos) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10001 };
    }
    const vh = window.innerHeight;
    const tooltipH = 180;
    // Tall element (e.g. sidebar): position to the right
    if (pos.height > vh * 0.5) {
      return { position: "fixed", top: Math.min(pos.top + 60, vh - tooltipH - 16), left: pos.left + pos.width + 16, zIndex: 10001 };
    }
    // Normal element: position below, clamped to viewport
    const top = Math.min(pos.top + pos.height + 12, vh - tooltipH - 16);
    return { position: "fixed", top, left: Math.max(16, Math.min(pos.left, window.innerWidth - 340)), zIndex: 10001 };
  };
  const tooltipStyle = getTooltipStyle();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[10000] bg-black/50" onClick={onSkip} />

      {/* Highlight cutout */}
      {hasTarget && pos && (
        <div
          className="fixed z-[10000] rounded-lg ring-4 ring-primary/60 pointer-events-none"
          style={{ top: pos.top - 4, left: pos.left - 4, width: pos.width + 8, height: pos.height + 8 }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="w-[320px] rounded-lg border border-border bg-card p-4 shadow-xl"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
          <button type="button" onClick={onSkip} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center -mt-2 -mr-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentStep ? "bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button size="sm" variant="ghost" onClick={onBack}>Back</Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

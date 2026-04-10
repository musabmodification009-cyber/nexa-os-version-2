import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Minimize2, Maximize2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const STEPS = [
  { label: "Browse the Catalog", description: "Explore your inventory items, search, and view details.", route: "/app/catalog" },
  { label: "Log a Movement", description: "Record stock received, shipped, or adjusted.", route: "/app/movements" },
  { label: "Check Low Stock", description: "See items needing attention on the dashboard.", route: "/app/dashboard" },
  { label: "Create a Purchase Order", description: "Restock by creating a new PO from suppliers.", route: "/app/purchase-orders" },
] as const;

interface Props {
  active: boolean;
  onClose: () => void;
}

export function DemoWalkthrough({ active, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!active) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleShowMe = () => {
    navigate({ to: current.route });
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  };

  if (isMobile) {
    return (
      <Sheet open={!minimized} onOpenChange={(open) => { if (!open) setMinimized(true); }}>
        <SheetContent side="bottom" className="h-auto max-h-[160px] p-4">
          <SheetTitle className="sr-only">Walkthrough</SheetTitle>
          <Progress value={progress} className="h-1 mb-3" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Step {step + 1}: {current.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" onClick={handleShowMe} className="gap-1">Show me <ChevronRight className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </SheetContent>
        {minimized && (
          <Button size="sm" className="fixed bottom-16 right-4 z-50 shadow-lg gap-1" onClick={() => setMinimized(false)}>
            <Maximize2 className="h-3 w-3" /> Walkthrough
          </Button>
        )}
      </Sheet>
    );
  }

  if (minimized) {
    return (
      <Button size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg gap-1" onClick={() => setMinimized(false)}>
        <Maximize2 className="h-3 w-3" /> Walkthrough ({step + 1}/{STEPS.length})
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[300px] rounded-lg border border-border bg-card p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">Walkthrough</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setMinimized(true)} className="text-muted-foreground hover:text-foreground p-1"><Minimize2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <Progress value={progress} className="h-1 mb-3" />
      <p className="text-sm font-medium text-foreground">Step {step + 1}: {current.label}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{current.description}</p>
      <Button size="sm" className="w-full gap-1" onClick={handleShowMe}>
        {step < STEPS.length - 1 ? <>Show me <ChevronRight className="h-3 w-3" /></> : "Finish Walkthrough"}
      </Button>
    </div>
  );
}

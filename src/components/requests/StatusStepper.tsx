import { Check, Circle, X } from "lucide-react";
import { RequestStatus } from "@/types/inventory";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Under Review" },
  { key: "decision", label: "Decision" },
  { key: "fulfilled", label: "Fulfilled" },
] as const;

function resolveStep(status: RequestStatus): {
  activeIdx: number;
  decisionLabel: string;
  isTerminal: boolean;
  isNegative: boolean;
} {
  switch (status) {
    case RequestStatus.Pending:
      return { activeIdx: 1, decisionLabel: "Decision", isTerminal: false, isNegative: false };
    case RequestStatus.Approved:
      return { activeIdx: 2, decisionLabel: "Approved", isTerminal: false, isNegative: false };
    case RequestStatus.PartiallyFulfilled:
      return { activeIdx: 2, decisionLabel: "Partial", isTerminal: false, isNegative: false };
    case RequestStatus.Fulfilled:
      return { activeIdx: 3, decisionLabel: "Approved", isTerminal: true, isNegative: false };
    case RequestStatus.Declined:
      return { activeIdx: 2, decisionLabel: "Declined", isTerminal: true, isNegative: true };
    case RequestStatus.Cancelled:
      return { activeIdx: 1, decisionLabel: "Decision", isTerminal: true, isNegative: true };
    default:
      return { activeIdx: 0, decisionLabel: "Decision", isTerminal: false, isNegative: false };
  }
}

interface StatusStepperProps {
  status: RequestStatus;
}

export function StatusStepper({ status }: StatusStepperProps) {
  const { activeIdx, decisionLabel, isTerminal, isNegative } = resolveStep(status);

  const labels = STEPS.map((s) =>
    s.key === "decision" ? decisionLabel : s.label,
  );

  return (
    <div className="flex items-center gap-0" role="list" aria-label="Request status">
      {labels.map((label, idx) => {
        const isCompleted = idx < activeIdx;
        const isActive = idx === activeIdx;
        const isFuture = idx > activeIdx;
        const isLast = idx === labels.length - 1;

        // Skip fulfilled step for declined/cancelled
        if (isLast && isTerminal && isNegative && idx > activeIdx) return null;

        return (
          <div key={idx} className="flex items-center" role="listitem">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-stock-healthy bg-stock-healthy text-stock-healthy-foreground",
                  isActive && !isNegative && "border-primary bg-primary text-primary-foreground",
                  isActive && isNegative && "border-destructive bg-destructive text-destructive-foreground",
                  isFuture && "border-muted-foreground/30 bg-transparent text-muted-foreground/30",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive && isNegative ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isCompleted && "text-stock-healthy",
                  isActive && !isNegative && "text-primary",
                  isActive && isNegative && "text-destructive",
                  isFuture && "text-muted-foreground/50",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && !(isLast && isTerminal && isNegative) && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-6 sm:w-10",
                  idx < activeIdx ? "bg-stock-healthy" : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

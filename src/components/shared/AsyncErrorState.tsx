import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AsyncErrorStateProps {
  error: Error;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function AsyncErrorState({ error, onRetry, compact = false, className }: AsyncErrorStateProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{error.message || "Failed to load data"}</span>
        {onRetry && (
          <button onClick={onRetry} className="underline text-xs hover:no-underline shrink-0">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <AlertCircle className="h-10 w-10 text-destructive/70 mb-3" strokeWidth={1.5} />
      <h3 className="text-base font-semibold text-foreground">Failed to load data</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {onRetry && (
        <Button size="sm" variant="default" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

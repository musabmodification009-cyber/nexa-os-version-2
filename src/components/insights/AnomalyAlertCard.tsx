import { useState } from "react";
import { AlertTriangle, ShieldAlert, Search, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnomalyAlert } from "@/lib/anomaly-engine";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AnomalyAlertCardProps {
  alert: AnomalyAlert;
  itemName?: string;
  itemSku?: string;
  onDismiss?: (alert: AnomalyAlert) => void;
}

export function AnomalyAlertCard({ alert, itemName, itemSku, onDismiss }: AnomalyAlertCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isCritical = alert.severity === "critical";
  const Icon = isCritical ? ShieldAlert : AlertTriangle;

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 pl-5 transition-all",
        isCritical && "animate-pulse-subtle",
      )}
    >
      <div className={cn(
        "absolute left-2 top-2 bottom-2 w-[3px] rounded-full",
        isCritical ? "bg-destructive" : "bg-stock-low",
      )} />
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            isCritical ? "text-destructive" : "text-stock-low",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold">{alert.title}</h4>
            <Badge
              variant={isCritical ? "destructive" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {alert.severity}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>

          {(itemName || itemSku) && (
            <p className="mt-1 text-xs">
              <Link
                to="/app/catalog"
                search={{ item: alert.itemId }}
                className="text-primary hover:underline"
              >
                {itemName}{itemSku ? ` (${itemSku})` : ""}
              </Link>
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{format(new Date(alert.detectedAt), "MMM d, yyyy h:mm a")}</span>
            <span>·</span>
            <span className="capitalize">{alert.type.replace(/_/g, " ")}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-6 text-xs" asChild>
              <Link to="/app/catalog" search={{ item: alert.itemId }}>
                <Search className="h-3 w-3 mr-1" />
                Investigate
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => {
                setDismissed(true);
                onDismiss?.(alert);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

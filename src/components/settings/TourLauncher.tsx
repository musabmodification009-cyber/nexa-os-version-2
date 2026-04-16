import { HelpCircle, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function TourLauncher() {
  const tour = useOnboarding("dashboard");
  const navigate = useNavigate();

  const handleLaunchTour = () => {
    tour.resetTour();
    navigate({ to: "/app/dashboard" });
    toast.info("Tour starting on dashboard...");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4" /> Help & Tour
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Take a guided tour of the app to learn about all the features available to you.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleLaunchTour} className="gap-2">
            <Play className="h-4 w-4" /> Launch Product Tour
          </Button>
          {tour.hasCompleted && (
            <Button variant="outline" onClick={handleLaunchTour} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Restart Tour
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <h4 className="text-sm font-semibold">Tour covers:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Dashboard overview and metrics</li>
            <li>Sales and POS workflow</li>
            <li>Inventory and catalog management</li>
            <li>Customer management</li>
            <li>Settings and configuration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

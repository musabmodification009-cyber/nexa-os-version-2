import { useState } from "react";
import { RotateCcw, Info, Play } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { DemoWalkthrough } from "@/components/onboarding/DemoWalkthrough";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SystemSettings() {
  const { isDemo, demoStore, resetDemoData } = useDemo();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [walkthroughActive, setWalkthroughActive] = useState(false);

  const items = demoStore?.getItems()?.length ?? 0;
  const suppliers = demoStore?.getSuppliers()?.length ?? 0;
  const locations = demoStore?.getLocations()?.length ?? 0;

  const handleReset = () => {
    resetDemoData();
    setConfirmOpen(false);
    toast.success("Demo data reset to defaults");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
          <CardDescription>Manage demo seed data for testing and exploration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemo ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{items}</p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{suppliers}</p>
                  <p className="text-xs text-muted-foreground">Suppliers</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{locations}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setWalkthroughActive(true)} className="gap-1.5">
                  <Play className="h-4 w-4" /> Start walkthrough
                </Button>
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Reset demo data
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Demo controls not available — enter demo mode first.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-4 w-4" />About</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Version</dt><dd className="font-medium">1.0.0</dd>
            <dt className="text-muted-foreground">Platform</dt><dd className="font-medium">Stackwise Inventory</dd>
          </dl>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo Data?</AlertDialogTitle>
            <AlertDialogDescription>This will reset all data to defaults. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DemoWalkthrough active={walkthroughActive} onClose={() => setWalkthroughActive(false)} />
    </div>
  );
}

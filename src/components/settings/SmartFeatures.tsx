import { useState } from "react";
import { Zap, Bell, ArrowDownUp, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SmartFeatures() {
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [autoReorder, setAutoReorder] = useState(false);
  const [salesNotifications, setSalesNotifications] = useState(true);

  const handleSave = () => {
    toast.success("Smart feature settings saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" /> Smart Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-sm font-medium">Low Stock Alerts</Label>
              <p className="text-xs text-muted-foreground">Get notified when items fall below reorder point</p>
            </div>
          </div>
          <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ArrowDownUp className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-sm font-medium">Auto Reorder Suggestions</Label>
              <p className="text-xs text-muted-foreground">AI-powered reorder suggestions based on sales trends</p>
            </div>
          </div>
          <Switch checked={autoReorder} onCheckedChange={setAutoReorder} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-sm font-medium">Sales Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified for each completed sale</p>
            </div>
          </div>
          <Switch checked={salesNotifications} onCheckedChange={setSalesNotifications} />
        </div>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

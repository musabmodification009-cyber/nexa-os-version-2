import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { CustomFieldManager } from "@/components/settings/CustomFieldManager";
import { LocationSettings } from "@/components/settings/LocationSettings";
import { ReorderDefaults } from "@/components/settings/ReorderDefaults";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { StoreSettings } from "@/components/settings/StoreSettings";
import { CustomerDirectory } from "@/components/settings/CustomerDirectory";
import { StoreBranding } from "@/components/settings/StoreBranding";
import { SmartFeatures } from "@/components/settings/SmartFeatures";
import { TourLauncher } from "@/components/settings/TourLauncher";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Stackwise" }] }),
});

function SettingsPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!can("access_settings")) {
      toast.error("Access denied");
      navigate({ to: "/app/dashboard" });
    }
  }, [can, navigate]);

  if (!can("access_settings")) return null;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">System configuration and management</p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="reorder-defaults">Reorder</TabsTrigger>
          <TabsTrigger value="smart">Smart Features</TabsTrigger>
          <TabsTrigger value="users">Staff</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="store">
            <ErrorBoundary><StoreSettings /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="branding">
            <ErrorBoundary><StoreBranding /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="customers">
            <ErrorBoundary><CustomerDirectory /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="categories">
            <ErrorBoundary><CategoryManager /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="custom-fields">
            <ErrorBoundary><CustomFieldManager /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="locations">
            <ErrorBoundary><LocationSettings /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="reorder-defaults">
            <ErrorBoundary><ReorderDefaults /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="smart">
            <ErrorBoundary><SmartFeatures /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="users">
            <ErrorBoundary><UserManagement /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="help">
            <ErrorBoundary><TourLauncher /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="system">
            <ErrorBoundary><SystemSettings /></ErrorBoundary>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

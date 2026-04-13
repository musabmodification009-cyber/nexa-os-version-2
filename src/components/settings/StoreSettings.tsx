import { useState } from "react";
import { Store, Save } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StoreSettings() {
  const { onboarding, updateOnboarding } = useDemo();

  const [storeName, setStoreName] = useState(onboarding.storeName || "");
  const [phone, setPhone] = useState(onboarding.storePhone || "");
  const [address, setAddress] = useState(onboarding.storeAddress || "");
  const [receiptFooter, setReceiptFooter] = useState(onboarding.receiptFooter || "");
  const [taxRate, setTaxRate] = useState(onboarding.taxRate?.toString() || "0");

  const handleSave = () => {
    updateOnboarding({
      storeName: storeName.trim(),
      storePhone: phone.trim(),
      storeAddress: address.trim(),
      receiptFooter: receiptFooter.trim(),
      taxRate: parseFloat(taxRate) || 0,
    });
    toast.success("Store settings saved");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" />Store Information</CardTitle>
          <CardDescription>Your store details appear on receipts and invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Store" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input id="store-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">Address</Label>
            <Textarea id="store-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, Lagos" rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input id="tax-rate" type="number" min="0" max="100" step="0.5" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
              <Input id="receipt-footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Thank you for your patronage!" />
            </div>
          </div>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

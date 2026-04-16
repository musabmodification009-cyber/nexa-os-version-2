import { useState } from "react";
import { Palette, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";

const BRAND_COLORS = [
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Orange", value: "#f97316" },
  { label: "Green", value: "#22c55e" },
];

export function StoreBranding() {
  const { onboarding, updateOnboarding } = useDemo();
  const [selectedColor, setSelectedColor] = useState(onboarding.brandColor ?? "#0d9488");
  const [logoUrl, setLogoUrl] = useState(onboarding.logoUrl ?? "");

  const handleSave = () => {
    updateOnboarding({ brandColor: selectedColor, logoUrl: logoUrl.trim() });
    toast.success("Branding updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4" /> Store Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs">Brand Color</Label>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="h-10 w-10 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: selectedColor === c.value ? "var(--foreground)" : "transparent",
                    transform: selectedColor === c.value ? "scale(1.15)" : "scale(1)",
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Label className="text-xs shrink-0">Custom</Label>
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="h-9 w-16 p-1 cursor-pointer"
            />
            <span className="text-xs font-mono text-muted-foreground">{selectedColor}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Logo URL</Label>
          <div className="relative">
            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="pl-10"
            />
          </div>
          {logoUrl && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/20">
              <img src={logoUrl} alt="Logo preview" className="h-12 w-12 rounded object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}
        </div>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}

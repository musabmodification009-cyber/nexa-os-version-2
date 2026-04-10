import { useState, useRef, useCallback, useEffect } from "react";
import { ScanBarcode, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/useInventoryData";
import { useCreateMovement } from "@/hooks/useInventoryMutations";
import { MovementType } from "@/types/inventory";
import type { Item, StockMovement } from "@/types/inventory";
import { toast } from "sonner";

interface QuickEntryModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickEntryMode({ open, onOpenChange }: QuickEntryModeProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [foundItem, setFoundItem] = useState<Item | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<MovementType>(MovementType.Received);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: items } = useItems();
  const createMovement = useCreateMovement();

  // Auto-focus input when opened or after action
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setFoundItem(null);
    setNotFound(null);
    setMovementType(MovementType.Received);
    setQuantity("");
    setNotes("");
    setBarcodeInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleLookup = useCallback(() => {
    const query = barcodeInput.trim();
    if (!query) return;

    const item = items.find(
      (i) => i.barcode?.toLowerCase() === query.toLowerCase() || i.sku.toLowerCase() === query.toLowerCase()
    );

    if (item) {
      setFoundItem(item);
      setNotFound(null);
    } else {
      setFoundItem(null);
      setNotFound(query);
    }
  }, [barcodeInput, items]);

  const handleSubmit = useCallback(() => {
    if (!foundItem || !quantity) return;

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: foundItem.id,
      type: movementType,
      quantity: Number(quantity),
      fromLocationId: null,
      toLocationId: null,
      reference: `Quick Entry`,
      notes,
      performedBy: "Demo Admin",
      createdAt: new Date().toISOString(),
    };

    createMovement.mutate(movement, {
      onSuccess: () => {
        toast.success(`${movementType} ${quantity} × ${foundItem.name}`);
        resetForm();
      },
    });
  }, [foundItem, movementType, quantity, notes, createMovement, resetForm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (foundItem || notFound) {
        resetForm();
      } else {
        onOpenChange(false);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-[480px]" onKeyDown={handleKeyDown}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Quick Entry
          </SheetTitle>
          <SheetDescription>Scan or type a barcode to look up an item and log a movement.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Barcode input */}
          <div>
            <Label htmlFor="barcode-scan" className="text-sm font-medium">Barcode / SKU</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="barcode-scan"
                ref={inputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                placeholder="Scan or type barcode…"
                className="h-12 text-lg font-mono"
                autoFocus
                autoComplete="off"
              />
              <Button onClick={handleLookup} className="h-12 px-5" disabled={!barcodeInput.trim()}>
                Look up
              </Button>
            </div>
          </div>

          {/* Not found */}
          {notFound && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">Item not found</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{notFound}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={resetForm}>
                Try again
              </Button>
            </div>
          )}

          {/* Found item */}
          {foundItem && (
            <>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{foundItem.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{foundItem.sku}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetForm} aria-label="Clear item">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-muted-foreground">Current stock:</span>
                  <span className="font-semibold font-mono">{foundItem.currentStock}</span>
                </div>
              </div>

              {/* Compact movement form */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Movement Type</Label>
                  <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MovementType.Received}>Received</SelectItem>
                      <SelectItem value={MovementType.Shipped}>Shipped</SelectItem>
                      <SelectItem value={MovementType.Adjusted}>Adjusted</SelectItem>
                      <SelectItem value={MovementType.Transferred}>Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="mt-1"
                    onKeyDown={(e) => { if (e.key === "Enter" && quantity) handleSubmit(); }}
                  />
                </div>

                <div>
                  <Label className="text-sm">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!quantity || createMovement.isLoading}
                  className="w-full"
                >
                  {createMovement.isLoading ? "Logging…" : "Log Movement"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

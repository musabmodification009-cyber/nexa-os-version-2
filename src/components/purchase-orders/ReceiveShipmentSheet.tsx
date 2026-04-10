import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PurchaseOrder, Item } from "@/types/inventory";

interface ReceiveShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
  items: Item[];
  onConfirm: (receivedLines: { lineItemId: string; itemId: string; qty: number }[], notes: string) => void;
}

export function ReceiveShipmentSheet({
  open,
  onOpenChange,
  purchaseOrder,
  items,
  onConfirm,
}: ReceiveShipmentSheetProps) {
  const itemMap = useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  const initialQtys = useMemo(
    () =>
      Object.fromEntries(
        purchaseOrder.items.map((li) => [
          li.id,
          Math.max(0, li.quantityOrdered - li.quantityReceived),
        ]),
      ),
    [purchaseOrder.items],
  );

  const [qtys, setQtys] = useState<Record<string, number>>(initialQtys);
  const [notes, setNotes] = useState("");

  // Reset when sheet opens with new PO
  const [lastPOId, setLastPOId] = useState(purchaseOrder.id);
  if (purchaseOrder.id !== lastPOId) {
    setLastPOId(purchaseOrder.id);
    setQtys(initialQtys);
    setNotes("");
  }

  const hasAnyQty = useMemo(
    () => Object.values(qtys).some((q) => q > 0),
    [qtys],
  );

  function handleQtyChange(lineId: string, remaining: number, value: string) {
    const num = Math.max(0, Math.min(remaining, Math.floor(Number(value) || 0)));
    setQtys((prev) => ({ ...prev, [lineId]: num }));
  }

  function handleConfirm() {
    const lines = purchaseOrder.items
      .filter((li) => (qtys[li.id] ?? 0) > 0)
      .map((li) => ({ lineItemId: li.id, itemId: li.itemId, qty: qtys[li.id] }));
    onConfirm(lines, notes);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>Receive Shipment — {purchaseOrder.orderNumber}</SheetTitle>
          <SheetDescription>
            Enter the quantity received for each line item.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[60px] text-right">Ordered</TableHead>
                  <TableHead className="w-[70px] text-right">Received</TableHead>
                  <TableHead className="w-[70px] text-right">Remaining</TableHead>
                  <TableHead className="w-[90px] text-right">Receiving</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((li) => {
                  const item = itemMap.get(li.itemId);
                  const remaining = Math.max(0, li.quantityOrdered - li.quantityReceived);
                  return (
                    <TableRow key={li.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{item?.name ?? li.itemId}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item?.sku ?? "—"}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {li.quantityOrdered}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {li.quantityReceived}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {remaining}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          value={qtys[li.id] ?? 0}
                          onChange={(e) => handleQtyChange(li.id, remaining, e.target.value)}
                          className="h-8 w-[70px] text-right font-mono text-sm ml-auto"
                          disabled={remaining === 0}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receive-notes">Shipment Notes</Label>
            <Textarea
              id="receive-notes"
              placeholder="Optional notes about this shipment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            disabled={!hasAnyQty}
            onClick={handleConfirm}
          >
            Confirm Receipt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

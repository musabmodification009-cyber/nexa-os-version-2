import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Package, AlertCircle, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import type { Refund, RefundReason } from "@/types/finance";
import { REFUND_REASONS } from "@/types/finance";

const NAIRA = "₦";

export const Route = createFileRoute("/app/returns")({
  component: ReturnsPage,
  head: () => ({ meta: [{ title: "Returns & Refunds — Stackwise" }] }),
});

function ReturnsPage() {
  const { demoStore, bumpVersion, version } = useDemo();
  const [formOpen, setFormOpen] = useState(false);
  const [filterReason, setFilterReason] = useState<string>("all");

  const refunds = useMemo(() => {
    void version;
    return demoStore?.getRefunds() ?? [];
  }, [demoStore, version]);

  const sales = useMemo(() => demoStore?.getSales() ?? [], [demoStore, version]);

  const filtered = filterReason === "all" ? refunds : refunds.filter((r) => r.reason === filterReason);

  const totalRefunded = filtered.reduce((s, r) => s + r.amountNgn, 0);

  return (
    <div className="mx-auto max-w-[1000px] space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Returns & Refunds</h1>
          <p className="text-sm text-muted-foreground">Process refunds, damaged goods, and returns</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> New Refund
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Refunds</p>
          <p className="text-xl font-bold font-mono">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Refunded</p>
          <p className="text-xl font-bold font-mono text-destructive">{NAIRA}{totalRefunded.toLocaleString("en-NG")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-xl font-bold font-mono">
            {filtered.filter((r) => {
              const d = new Date(r.createdAt);
              const now = new Date();
              return now.getTime() - d.getTime() < 7 * 86400000;
            }).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            {REFUND_REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Refund list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <RotateCcw className="h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No refunds recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.itemName}</p>
                <p className="text-xs text-muted-foreground">Qty: {r.quantity} · {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-destructive">-{NAIRA}{r.amountNgn.toLocaleString("en-NG")}</p>
                <Badge variant="outline" className="text-[10px]">{REFUND_REASONS.find((rr) => rr.value === r.reason)?.label ?? r.reason}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <RefundFormSheet open={formOpen} onOpenChange={setFormOpen} sales={sales} demoStore={demoStore} bumpVersion={bumpVersion} />
    </div>
  );
}

function RefundFormSheet({ open, onOpenChange, sales, demoStore, bumpVersion }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sales: { id: string; items: { itemId: string; itemName: string; quantity: number; unitPriceNgn: number }[]; createdAt: string }[];
  demoStore: ReturnType<typeof useDemo>["demoStore"];
  bumpVersion: () => void;
}) {
  const [saleId, setSaleId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState<RefundReason>("customer_return");
  const [notes, setNotes] = useState("");

  const selectedSale = sales.find((s) => s.id === saleId);
  const selectedItem = selectedSale?.items.find((i) => i.itemId === itemId);

  const handleSubmit = () => {
    if (!selectedSale || !selectedItem || !demoStore) return;
    const refund: Refund = {
      id: `ref-${Date.now()}`,
      saleId,
      itemId: selectedItem.itemId,
      itemName: selectedItem.itemName,
      quantity: qty,
      amountNgn: selectedItem.unitPriceNgn * qty,
      reason,
      notes,
      createdAt: new Date().toISOString(),
    };
    demoStore.addRefund(refund);
    bumpVersion();
    toast.success(`Refund processed: ${NAIRA}${refund.amountNgn.toLocaleString("en-NG")}`);
    onOpenChange(false);
    setSaleId("");
    setItemId("");
    setQty(1);
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Process Refund</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Sale</Label>
            <Select value={saleId} onValueChange={(v) => { setSaleId(v); setItemId(""); }}>
              <SelectTrigger><SelectValue placeholder="Pick a sale..." /></SelectTrigger>
              <SelectContent>
                {sales.slice(0, 20).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {new Date(s.createdAt).toLocaleDateString()} — {s.items.length} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSale && (
            <div className="space-y-1.5">
              <Label className="text-xs">Select Item</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger><SelectValue placeholder="Pick item..." /></SelectTrigger>
                <SelectContent>
                  {selectedSale.items.map((i) => (
                    <SelectItem key={i.itemId} value={i.itemId}>{i.itemName} (×{i.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Quantity</Label>
            <Input type="number" min={1} max={selectedItem?.quantity ?? 1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as RefundReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." rows={3} />
          </div>

          {selectedItem && (
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Refund Amount</p>
              <p className="text-lg font-bold font-mono text-destructive">
                {NAIRA}{(selectedItem.unitPriceNgn * qty).toLocaleString("en-NG")}
              </p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!selectedItem} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" /> Process Refund
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

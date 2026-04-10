import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Package, Pencil, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SupplierOrderHistory } from "@/components/suppliers/SupplierOrderHistory";
import { SupplierPerformance } from "@/components/suppliers/SupplierPerformance";
import { SupplierDeleteDialog } from "@/components/suppliers/SupplierDeleteDialog";
import type { Supplier, Item, PurchaseOrder } from "@/types/inventory";

interface SupplierDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

const MAX_LINKED = 10;

export function SupplierDetailSheet({
  open,
  onOpenChange,
  supplier,
  items,
  purchaseOrders,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: SupplierDetailSheetProps) {
  const linkedItems = useMemo(() => {
    if (!supplier) return [];
    return items.filter((i) => i.supplierId === supplier.id);
  }, [items, supplier]);

  if (!supplier) return null;

  const displayed = linkedItems.slice(0, MAX_LINKED);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{supplier.name}</SheetTitle>
            <div className="flex items-center gap-2">
              {canDelete && (
                <SupplierDeleteDialog
                  supplier={supplier}
                  items={items}
                  purchaseOrders={purchaseOrders}
                  onDelete={(id) => { onDelete(id); onOpenChange(false); }}
                />
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(supplier);
                  }}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          <SheetDescription>
            {supplier.isActive ? "Active supplier" : "Inactive supplier"}
          </SheetDescription>
        </SheetHeader>

        {/* ── Detail grid ──────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField icon={<Mail className="h-4 w-4" />} label="Email">
            {supplier.email ? (
              <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                {supplier.email}
              </a>
            ) : "—"}
          </DetailField>

          <DetailField icon={<Phone className="h-4 w-4" />} label="Phone">
            {supplier.phone ? (
              <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                {supplier.phone}
              </a>
            ) : "—"}
          </DetailField>

          <DetailField label="Contact Person">
            {supplier.contactName || "—"}
          </DetailField>

          <DetailField icon={<Clock className="h-4 w-4" />} label="Lead Time">
            <span className="font-mono">{supplier.leadTimeDays}d</span>
          </DetailField>

          <DetailField icon={<MapPin className="h-4 w-4" />} label="Address" full>
            {supplier.address || "—"}
          </DetailField>

          {supplier.notes && (
            <DetailField label="Notes" full>
              {supplier.notes}
            </DetailField>
          )}
        </div>

        {/* ── Linked Items ─────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Linked Items ({linkedItems.length})
            </h3>
          </div>

          {linkedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No items from this supplier</p>
          ) : (
            <div className="space-y-1">
              {displayed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{item.sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.currentStock} {item.unit}
                    </span>
                    <StatusBadge status={item.currentStock <= 0 ? "out-of-stock" : item.currentStock <= item.reorderPoint ? "low-stock" : "in-stock"} />
                  </div>
                </div>
              ))}

              {linkedItems.length > MAX_LINKED && (
                <Link
                  to="/app/catalog"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View all in catalog
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Performance ───────────────────────── */}
        <SupplierPerformance purchaseOrders={purchaseOrders} supplierId={supplier.id} />

        {/* ── Order History ────────────────────────── */}
        <SupplierOrderHistory purchaseOrders={purchaseOrders} supplierId={supplier.id} />
      </SheetContent>
    </Sheet>
  );
}

/* ── Helper ─────────────────────────────────────────── */

function DetailField({
  icon,
  label,
  children,
  full,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-0.5">
        {icon}
        {label}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

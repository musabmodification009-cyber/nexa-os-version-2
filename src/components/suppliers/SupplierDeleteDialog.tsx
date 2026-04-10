import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Supplier, Item, PurchaseOrder } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";

interface SupplierDeleteDialogProps {
  supplier: Supplier;
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  onDelete: (id: string) => void;
}

export function SupplierDeleteDialog({ supplier, items, purchaseOrders, onDelete }: SupplierDeleteDialogProps) {
  const [open, setOpen] = useState(false);

  const linkedCount = useMemo(
    () => items.filter((i) => i.supplierId === supplier.id).length,
    [items, supplier.id],
  );

  const openPOs = useMemo(
    () => purchaseOrders.filter(
      (po) => po.supplierId === supplier.id && [OrderStatus.Draft, OrderStatus.Submitted, OrderStatus.Partial].includes(po.status),
    ),
    [purchaseOrders, supplier.id],
  );

  const hasOpenPOs = openPOs.length > 0;

  function handleClick() {
    if (hasOpenPOs) {
      toast.error(`Cannot delete supplier with ${openPOs.length} open purchase order${openPOs.length > 1 ? "s" : ""}.`);
      return;
    }
    setOpen(true);
  }

  function handleConfirm() {
    onDelete(supplier.id);
    setOpen(false);
    toast.success("Supplier deleted");
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="destructive" onClick={handleClick}>
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {supplier.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {linkedCount > 0
              ? `This supplier is linked to ${linkedCount} item${linkedCount > 1 ? "s" : ""}. Deleting will remove the supplier reference from those items. Continue?`
              : "This action cannot be undone. The supplier will be permanently removed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

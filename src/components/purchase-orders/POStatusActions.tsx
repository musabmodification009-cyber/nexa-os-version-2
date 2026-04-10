import { useState } from "react";
import { Send, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useUpdatePurchaseOrder } from "@/hooks/useInventoryMutations";
import { usePermissions } from "@/hooks/usePermissions";
import { OrderStatus } from "@/types/inventory";
import type { PurchaseOrder } from "@/types/inventory";

interface POStatusActionsProps {
  purchaseOrder: PurchaseOrder;
}

export function POStatusActions({ purchaseOrder }: POStatusActionsProps) {
  const { can } = usePermissions();
  const canManage = can("create_po");
  const updatePO = useUpdatePurchaseOrder();
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!canManage) return null;

  const { status } = purchaseOrder;
  const isTerminal = status === OrderStatus.Received || status === OrderStatus.Cancelled;
  if (isTerminal) return null;

  function handleSubmit() {
    updatePO.mutate(
      {
        id: purchaseOrder.id,
        updates: { status: OrderStatus.Submitted, updatedAt: new Date().toISOString() },
      },
      {
        onSuccess: () => toast.success(`${purchaseOrder.orderNumber} submitted`),
      },
    );
  }

  function handleCancel() {
    updatePO.mutate(
      {
        id: purchaseOrder.id,
        updates: { status: OrderStatus.Cancelled, updatedAt: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          toast.success(`${purchaseOrder.orderNumber} cancelled`);
          setCancelOpen(false);
        },
      },
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {status === OrderStatus.Draft && (
          <Button size="sm" onClick={handleSubmit} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Submit
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:bg-destructive/10"
          onClick={() => setCancelOpen(true)}
        >
          <Ban className="h-3.5 w-3.5" />
          Cancel PO
        </Button>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {purchaseOrder.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the purchase order as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

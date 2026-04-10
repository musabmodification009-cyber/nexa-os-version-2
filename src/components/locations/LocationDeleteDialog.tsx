import { useState } from "react";
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
import { useDeleteLocation } from "@/hooks/useInventoryMutations";
import { useUpdateItem } from "@/hooks/useInventoryMutations";
import type { LocationTreeNode } from "@/hooks/useLocations";
import type { Item } from "@/types/inventory";

interface LocationDeleteDialogProps {
  node: LocationTreeNode;
  items: Item[];
  onDeleted: () => void;
}

export function LocationDeleteDialog({
  node,
  items,
  onDeleted,
}: LocationDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteLocation = useDeleteLocation();
  const updateItem = useUpdateItem();

  const hasChildren = node.children.length > 0;
  const affectedItems = items.filter((i) => i.locationId === node.id);
  const hasItems = affectedItems.length > 0;

  function handleDelete() {
    // Unassign items first
    for (const item of affectedItems) {
      updateItem.mutate({ id: item.id, updates: { locationId: null } });
    }

    deleteLocation.mutate(node.id, {
      onSuccess: () => {
        toast.success(`Location "${node.name}" deleted`);
        setOpen(false);
        onDeleted();
      },
      onError: (e) => toast.error(e.message || "Failed to delete location."),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              setOpen(true);
            }
          }}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Delete location"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{node.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren ? (
              <>
                Cannot delete a location with sub-locations. Remove or move
                children first.
              </>
            ) : hasItems ? (
              <>
                This location has {affectedItems.length} item
                {affectedItems.length !== 1 && "s"}. They will become
                unassigned.
              </>
            ) : (
              <>This location will be permanently deleted.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!hasChildren && (
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { MoreVertical, Eye, Pencil, ArrowRightLeft, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import type { Item } from "@/types/inventory";

interface RowActionsMenuProps {
  item: Item;
  onViewDetails: (item: Item) => void;
  onEdit: (item: Item) => void;
  onLogMovement: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function RowActionsMenu({
  item,
  onViewDetails,
  onEdit,
  onLogMovement,
  onDelete,
}: RowActionsMenuProps) {
  const { can } = usePermissions();
  const { isAdmin } = useRole();
  const canEdit = can("edit_item");
  const canLog = can("log_movement");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(item)}>
          <Eye className="mr-2 h-4 w-4" />View Details
        </DropdownMenuItem>

        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Pencil className="mr-2 h-4 w-4" />Edit
          </DropdownMenuItem>
        )}

        {canLog && (
          <DropdownMenuItem onClick={() => onLogMovement(item)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />Log Movement
          </DropdownMenuItem>
        )}

        {canEdit && (
          <>
            <DropdownMenuSeparator />
            {isAdmin ? (
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onDelete(item)}>
                <Archive className="mr-2 h-4 w-4" />Archive
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

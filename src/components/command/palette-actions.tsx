import {
  Plus,
  ArrowRightLeft,
  ShoppingCart,
  ClipboardList,
  Truck,
  FileDown,
} from "lucide-react";
import type { useNavigate } from "@tanstack/react-router";
import type { usePermissions } from "@/hooks/usePermissions";

export interface ActionDef {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: (navigate: ReturnType<typeof useNavigate>) => void;
  permission?: Parameters<ReturnType<typeof usePermissions>["can"]>[0];
}

export const ACTIONS: ActionDef[] = [
  {
    label: "New Item",
    icon: <Plus className="h-4 w-4" />,
    shortcut: "N I",
    action: (nav) => nav({ to: "/app/catalog", search: {} }),
    permission: "create_item",
  },
  {
    label: "New Movement",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    shortcut: "N M",
    action: (nav) => nav({ to: "/app/movements", search: { item: undefined } }),
    permission: "log_movement",
  },
  {
    label: "New Purchase Order",
    icon: <ShoppingCart className="h-4 w-4" />,
    shortcut: "N P",
    action: (nav) => nav({ to: "/app/purchase-orders", search: {} }),
    permission: "create_po",
  },
  {
    label: "New Request",
    icon: <ClipboardList className="h-4 w-4" />,
    action: (nav) => nav({ to: "/app/requests", search: { request: undefined } }),
    permission: "create_request",
  },
  {
    label: "New Supplier",
    icon: <Truck className="h-4 w-4" />,
    action: (nav) => nav({ to: "/app/suppliers" }),
    permission: "manage_suppliers",
  },
  {
    label: "Export Items CSV",
    icon: <FileDown className="h-4 w-4" />,
    action: (nav) => nav({ to: "/app/catalog", search: {} }),
    permission: "export_data",
  },
];

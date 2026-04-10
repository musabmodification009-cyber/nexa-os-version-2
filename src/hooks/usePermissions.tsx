import { type ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import type { UserRoleType } from "@/lib/roles";

type PermissionAction =
  | "create_item" | "edit_item" | "delete_item"
  | "log_movement" | "create_po" | "approve_request"
  | "manage_users" | "view_analytics" | "export_data"
  | "create_request" | "access_settings" | "manage_suppliers";

const ACTION_ROLES: Record<PermissionAction, UserRoleType[]> = {
  create_item: ["admin", "manager"],
  edit_item: ["admin", "manager"],
  delete_item: ["admin", "manager"],
  log_movement: ["admin", "manager"],
  create_po: ["admin", "manager"],
  approve_request: ["admin", "manager"],
  manage_users: ["admin"],
  view_analytics: ["admin", "manager"],
  export_data: ["admin", "manager"],
  create_request: ["admin", "manager", "requestor"],
  access_settings: ["admin"],
  manage_suppliers: ["admin", "manager"],
};

export function usePermissions() {
  const { role } = useRole();

  const can = (action: PermissionAction): boolean => {
    return ACTION_ROLES[action]?.includes(role) ?? false;
  };

  return { can };
}

interface PermissionGateProps {
  permission: PermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

import type { UserRoleType } from "@/lib/roles";

/** Maps route paths to the minimum roles allowed */
const ROUTE_ACCESS: Record<string, UserRoleType[]> = {
  "/app/dashboard": ["admin", "manager", "requestor"],
  "/app/catalog": ["admin", "manager", "requestor"],
  "/app/requests": ["admin", "manager", "requestor"],
  "/app/movements": ["admin", "manager"],
  "/app/suppliers": ["admin", "manager"],
  "/app/purchase-orders": ["admin", "manager", "requestor"],
  "/app/analytics": ["admin", "manager"],
  "/app/ai-insights": ["admin", "manager"],
  "/app/settings": ["admin"],
};

/**
 * Returns true if the given role can access the path.
 * Unknown paths default to admin-only.
 */
export function canAccessRoute(path: string, role: UserRoleType): boolean {
  const allowed = ROUTE_ACCESS[path];
  if (!allowed) return role === "admin";
  return allowed.includes(role);
}

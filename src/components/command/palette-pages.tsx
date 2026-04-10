import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Truck,
  ShoppingCart,
  ClipboardList,
  MapPin,
  Settings,
} from "lucide-react";

export interface PageDef {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const PAGES: PageDef[] = [
  { label: "Dashboard", path: "/app/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Catalog", path: "/app/catalog", icon: <Package className="h-4 w-4" /> },
  { label: "Movements", path: "/app/movements", icon: <ArrowRightLeft className="h-4 w-4" /> },
  { label: "Suppliers", path: "/app/suppliers", icon: <Truck className="h-4 w-4" /> },
  { label: "Purchase Orders", path: "/app/purchase-orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Requests", path: "/app/requests", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Locations", path: "/app/locations", icon: <MapPin className="h-4 w-4" /> },
  { label: "Settings", path: "/app/settings", icon: <Settings className="h-4 w-4" /> },
];

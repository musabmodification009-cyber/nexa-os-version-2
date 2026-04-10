import type {
  Item,
  Category,
  Supplier,
  Location,
  StockMovement,
  PurchaseOrder,
  InventoryRequest,
  Notification,
} from "@/types/inventory";
import { categories, suppliers, locations } from "./seed-base";
import { items } from "./seed-items";
import { generateMovements, generatePurchaseOrders, generateRequests } from "./seed-activity";
import { generateNotifications } from "./seed-notifications";

export interface NotificationPrefs {
  low_stock: boolean;
  zero_stock: boolean;
  po_reminder: boolean;
  po_overdue: boolean;
  request_update: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  low_stock: true,
  zero_stock: true,
  po_reminder: true,
  po_overdue: true,
  request_update: true,
};

export interface SeedData {
  categories: Category[];
  items: Item[];
  suppliers: Supplier[];
  locations: Location[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  requests: InventoryRequest[];
  notifications: Notification[];
  notificationPrefs: NotificationPrefs;
}

export function generateSeedData(): SeedData {
  return {
    categories: [...categories],
    items: items.map((i) => ({ ...i })),
    suppliers: [...suppliers],
    locations: [...locations],
    movements: generateMovements(),
    purchaseOrders: generatePurchaseOrders(),
    requests: generateRequests(),
    notifications: generateNotifications(),
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
  };
}

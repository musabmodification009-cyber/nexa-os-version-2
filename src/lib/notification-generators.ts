import type { Notification } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";
import type { DemoStore } from "@/lib/demo-store";
import { differenceInDays } from "date-fns";

/**
 * Scan items and generate low_stock / zero_stock notifications.
 * Deduplicates: skips if an unread alert for the same item already exists.
 */
export function generateStockAlerts(store: DemoStore): void {
  const prefs = store.getNotificationPrefs();
  const items = store.getItems();
  const existing = store.getNotifications();

  for (const item of items) {
    if (item.status !== "active") continue;

    const isLow = item.currentStock > 0 && item.currentStock <= item.reorderPoint;
    const isOut = item.currentStock <= 0;

    if (!isLow && !isOut) continue;

    const type = isOut ? "zero_stock" as const : "low_stock" as const;
    if (!prefs[type]) continue;

    const alreadyExists = existing.some(
      (n) => !n.isRead && n.type === type && n.referenceId === item.id,
    );
    if (alreadyExists) continue;

    const notification: Notification = {
      id: `notif-auto-${type}-${item.id}-${Date.now()}`,
      type,
      title: isOut
        ? `Out of Stock: ${item.name}`
        : `Low Stock: ${item.name}`,
      message: isOut
        ? `${item.name} (${item.sku}) has reached zero stock. Reorder immediately.`
        : `${item.name} (${item.sku}) stock is at ${item.currentStock} units, below reorder point of ${item.reorderPoint}.`,
      isRead: false,
      link: `/app/catalog?item=${item.id}`,
      referenceId: item.id,
      createdAt: new Date().toISOString(),
    };

    store.addNotification(notification);
  }
}

/**
 * Scan POs and generate po_reminder / po_overdue notifications.
 * po_reminder: submitted PO with expected_delivery within 3 days.
 * po_overdue: submitted/partial PO with expected_delivery in the past.
 * Deduplicates by PO ID + type.
 */
export function generatePOAlerts(store: DemoStore): void {
  const prefs = store.getNotificationPrefs();
  const pos = store.getPurchaseOrders();
  const existing = store.getNotifications();
  const now = new Date();

  for (const po of pos) {
    // Only active POs (submitted or partial)
    if (po.status !== OrderStatus.Submitted && po.status !== OrderStatus.Partial) continue;
    if (!po.expectedDelivery) continue;

    const delivery = new Date(po.expectedDelivery);
    const daysUntil = differenceInDays(delivery, now);

    // Overdue: past delivery, not fully received
    if (daysUntil < 0 && prefs.po_overdue) {
      const alreadyExists = existing.some(
        (n) => !n.isRead && n.type === "po_overdue" && n.referenceId === po.id,
      );
      if (!alreadyExists) {
        store.addNotification({
          id: `notif-auto-po_overdue-${po.id}-${Date.now()}`,
          type: "po_overdue",
          title: `PO Overdue: ${po.orderNumber}`,
          message: `Purchase order ${po.orderNumber} was expected ${Math.abs(daysUntil)} days ago and has not been fully received.`,
          isRead: false,
          link: `/app/purchase-orders?po=${po.id}`,
          referenceId: po.id,
          createdAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // Reminder: within 3 days
    if (daysUntil <= 3 && prefs.po_reminder) {
      const alreadyExists = existing.some(
        (n) => !n.isRead && n.type === "po_reminder" && n.referenceId === po.id,
      );
      if (!alreadyExists) {
        store.addNotification({
          id: `notif-auto-po_reminder-${po.id}-${Date.now()}`,
          type: "po_reminder",
          title: `PO Arriving Soon: ${po.orderNumber}`,
          message: `Purchase order ${po.orderNumber} is expected to arrive in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
          isRead: false,
          link: `/app/purchase-orders?po=${po.id}`,
          referenceId: po.id,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

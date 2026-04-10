import type { Notification } from "@/types/inventory";
import { subHours, subDays, subMinutes } from "date-fns";

export function generateNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: "notif-001",
      type: "zero_stock",
      title: "Out of Stock: Printer Toner Black",
      message: "Printer Toner Black (STK-1005) has reached zero stock. Reorder immediately to avoid disruptions.",
      isRead: false,
      link: "/app/catalog?item=itm-005",
      referenceId: "itm-005",
      createdAt: subMinutes(now, 25).toISOString(),
    },
    {
      id: "notif-002",
      type: "low_stock",
      title: "Low Stock: Whiteboard Markers",
      message: "Whiteboard Markers (STK-1012) stock is at 18 units, below reorder point of 20.",
      isRead: false,
      link: "/app/catalog?item=itm-012",
      referenceId: "itm-012",
      createdAt: subHours(now, 2).toISOString(),
    },
    {
      id: "notif-003",
      type: "po_overdue",
      title: "PO Overdue: PO-2024-001",
      message: "Purchase order PO-2024-001 was expected 3 days ago and has not been fully received.",
      isRead: false,
      link: "/app/purchase-orders?po=po-001",
      referenceId: "po-001",
      createdAt: subHours(now, 6).toISOString(),
    },
    {
      id: "notif-004",
      type: "po_reminder",
      title: "PO Arriving Soon: PO-2024-002",
      message: "Purchase order PO-2024-002 is expected to arrive within 2 days.",
      isRead: true,
      link: "/app/purchase-orders?po=po-002",
      referenceId: "po-002",
      createdAt: subDays(now, 1).toISOString(),
    },
    {
      id: "notif-005",
      type: "request_update",
      title: "Request Approved: REQ-2024-001",
      message: "Your inventory request REQ-2024-001 has been approved and is being processed.",
      isRead: true,
      link: "/app/requests?request=req-001",
      referenceId: "req-001",
      createdAt: subDays(now, 2).toISOString(),
    },
    {
      id: "notif-006",
      type: "low_stock",
      title: "Low Stock: Desk Organizer",
      message: "Desk Organizer (STK-1020) stock is at 7 units, below reorder point of 10.",
      isRead: false,
      link: "/app/catalog?item=itm-020",
      referenceId: "itm-020",
      createdAt: subHours(now, 4).toISOString(),
    },
    {
      id: "notif-007",
      type: "system",
      title: "Welcome to Stackwise",
      message: "Your inventory management system is ready. Explore the dashboard to get started.",
      isRead: true,
      link: "/app/dashboard",
      referenceId: null,
      createdAt: subDays(now, 5).toISOString(),
    },
  ];
}

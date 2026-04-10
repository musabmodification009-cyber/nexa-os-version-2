import type { Item } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const item = (
  idx: number,
  name: string,
  catId: string,
  supId: string,
  locId: string,
  stock: number,
  reorder: number,
  cost: number,
  sell: number,
): Item => ({
  id: `itm-${String(idx).padStart(3, "0")}`,
  sku: `STK-${String(1000 + idx)}`,
  barcode: idx % 3 === 0 ? null : `49${String(10000000 + idx * 137).slice(0, 8)}${idx % 10}`,
  name,
  description: `${name} — standard inventory item`,
  categoryId: catId,
  status: ItemStatus.Active,
  unit: "ea",
  currentStock: stock,
  reorderPoint: reorder,
  reorderQuantity: reorder * 2,
  costPrice: cost,
  sellingPrice: sell,
  locationId: locId,
  supplierId: supId,
  imageUrl: null,
  customFields: {},
  createdAt: ts(60),
  updatedAt: ts(Math.floor(Math.random() * 30)),
});

// ~20 healthy (stock > reorder), ~10 low (stock <= reorder & > 0), ~5 out (stock = 0)
const cf = (fields: Record<string, string | number | boolean>) => fields;

export const items: Item[] = [
  // Electronics — 8 items
  { ...item(1, "USB-C Charging Cable", "cat-01", "sup-02", "loc-01", 150, 30, 3.5, 8.99), customFields: cf({ "Lot Number": "LOT-2024-A1", "Color": "Black", "Warranty Months": 12 }) },
  { ...item(2, "Wireless Mouse", "cat-01", "sup-02", "loc-01", 18, 20, 12, 24.99), customFields: cf({ "Lot Number": "LOT-2024-B3", "Color": "Silver", "Wireless": true }) }, // low
  { ...item(3, "HDMI Adapter", "cat-01", "sup-01", "loc-01", 42, 15, 8, 15.99), customFields: cf({ "Lot Number": "LOT-2024-C2" }) },
  item(4, "Surge Protector", "cat-01", "sup-01", "loc-01", 12, 10, 15, 29.99), // low
  item(5, "LED Desk Lamp", "cat-01", "sup-02", "loc-02", 0, 10, 22, 39.99), // out
  item(6, "Laptop Stand", "cat-01", "sup-02", "loc-01", 65, 15, 18, 34.99),
  item(7, "Power Bank 10000mAh", "cat-01", "sup-01", "loc-02", 8, 12, 14, 27.99), // low
  item(8, "Webcam HD 1080p", "cat-01", "sup-02", "loc-01", 9, 10, 25, 49.99), // low

  // Office Supplies — 8 items
  { ...item(9, "A4 Copy Paper (Ream)", "cat-02", "sup-01", "loc-01", 200, 50, 4, 7.99), customFields: cf({ "Expiration Date": "2026-12-31", "Recyclable": true }) },
  item(10, "Ballpoint Pens (12pk)", "cat-02", "sup-01", "loc-01", 20, 25, 2, 5.99), // low
  item(11, "Sticky Notes (6pk)", "cat-02", "sup-01", "loc-02", 55, 20, 3, 6.49),
  item(12, "Binder Clips (Box)", "cat-02", "sup-03", "loc-01", 40, 15, 1.5, 3.99),
  item(13, "Whiteboard Markers (8pk)", "cat-02", "sup-03", "loc-02", 5, 10, 4, 8.99), // low
  item(14, "Desk Organizer", "cat-02", "sup-01", "loc-03", 0, 8, 11, 19.99), // out
  item(15, "Stapler Heavy-Duty", "cat-02", "sup-01", "loc-01", 28, 10, 9, 16.99),
  item(16, "File Folders (50pk)", "cat-02", "sup-03", "loc-01", 75, 20, 8, 14.99),

  // Cleaning — 7 items
  item(17, "All-Purpose Cleaner (1gal)", "cat-03", "sup-03", "loc-01", 45, 15, 6, 11.99),
  item(18, "Microfiber Cloths (24pk)", "cat-03", "sup-03", "loc-01", 60, 20, 8, 14.99),
  item(19, "Floor Mop System", "cat-03", "sup-03", "loc-01", 3, 5, 25, 44.99), // low
  item(20, "Hand Sanitizer (1L)", "cat-03", "sup-03", "loc-02", 0, 20, 5, 9.99), // out
  item(21, "Trash Bags (100ct)", "cat-03", "sup-03", "loc-01", 80, 25, 12, 19.99),
  item(22, "Glass Cleaner (32oz)", "cat-03", "sup-03", "loc-02", 35, 10, 4, 7.49),
  item(23, "Disinfecting Wipes (75ct)", "cat-03", "sup-03", "loc-01", 7, 15, 6, 10.99), // low

  // Safety Equipment — 6 items
  item(24, "Safety Glasses (12pk)", "cat-04", "sup-04", "loc-01", 48, 12, 18, 32.99),
  item(25, "Nitrile Gloves (100ct)", "cat-04", "sup-04", "loc-01", 28, 30, 9, 16.99), // low
  item(26, "Hard Hat ANSI Type I", "cat-04", "sup-04", "loc-01", 22, 8, 14, 24.99),
  item(27, "High-Vis Vest", "cat-04", "sup-04", "loc-01", 6, 10, 7, 12.99), // low
  item(28, "First Aid Kit", "cat-04", "sup-04", "loc-02", 0, 5, 30, 54.99), // out
  item(29, "Ear Plugs (200pr)", "cat-04", "sup-04", "loc-01", 65, 20, 12, 22.99),

  // Tools — 6 items
  item(30, "Cordless Drill Kit", "cat-05", "sup-01", "loc-01", 18, 5, 55, 99.99),
  item(31, "Socket Wrench Set", "cat-05", "sup-01", "loc-01", 25, 8, 28, 49.99),
  item(32, "Tape Measure 25ft", "cat-05", "sup-01", "loc-02", 40, 12, 6, 11.99),
  item(33, "Utility Knife", "cat-05", "sup-01", "loc-01", 4, 10, 5, 9.99), // low
  item(34, "Hex Key Set", "cat-05", "sup-01", "loc-01", 0, 8, 10, 17.99), // out
  item(35, "Cable Ties (500pk)", "cat-05", "sup-02", "loc-01", 90, 25, 7, 12.99),
];

import type { Category, Supplier, Location } from "@/types/inventory";

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const categories: Category[] = [
  { id: "cat-01", name: "Electronics", description: "Electronic components and devices", parentId: null, createdAt: ts(90), updatedAt: ts(90) },
  { id: "cat-02", name: "Office Supplies", description: "Paper, pens, and office essentials", parentId: null, createdAt: ts(90), updatedAt: ts(90) },
  { id: "cat-03", name: "Cleaning", description: "Cleaning products and janitorial supplies", parentId: null, createdAt: ts(90), updatedAt: ts(90) },
  { id: "cat-04", name: "Safety Equipment", description: "PPE and safety gear", parentId: null, createdAt: ts(90), updatedAt: ts(90) },
  { id: "cat-05", name: "Tools", description: "Hand tools and power tools", parentId: null, createdAt: ts(90), updatedAt: ts(90) },
];

export const suppliers: Supplier[] = [
  { id: "sup-01", name: "Acme Supply Co", contactName: "John Carter", email: "john@acmesupply.com", phone: "555-0101", address: "123 Industrial Ave, Chicago IL", leadTimeDays: 5, rating: 4.5, isActive: true, notes: "Primary electronics vendor", createdAt: ts(120), updatedAt: ts(10) },
  { id: "sup-02", name: "TechParts Direct", contactName: "Sarah Lin", email: "sarah@techparts.com", phone: "555-0202", address: "456 Tech Blvd, San Jose CA", leadTimeDays: 3, rating: 4.8, isActive: true, notes: "Fast shipping, premium pricing", createdAt: ts(100), updatedAt: ts(5) },
  { id: "sup-03", name: "CleanPro Distributors", contactName: "Mike Davis", email: "mike@cleanpro.com", phone: "555-0303", address: "789 Clean St, Houston TX", leadTimeDays: 7, rating: 4.0, isActive: true, notes: "Bulk discounts available", createdAt: ts(80), updatedAt: ts(15) },
  { id: "sup-04", name: "SafetyFirst Inc", contactName: "Lisa Park", email: "lisa@safetyfirst.com", phone: "555-0404", address: "321 Safety Rd, Atlanta GA", leadTimeDays: 4, rating: 4.3, isActive: true, notes: "OSHA compliant products", createdAt: ts(70), updatedAt: ts(8) },
];

export const locations: Location[] = [
  // Main Warehouse hierarchy
  { id: "loc-01", name: "Main Warehouse", type: "warehouse", parentId: null, description: "Primary storage facility", address: "100 Warehouse Dr, Chicago IL", isActive: true, createdAt: ts(120), updatedAt: ts(5) },
  { id: "loc-01-z1", name: "Zone A — Electronics", type: "zone", parentId: "loc-01", description: "Electronics storage zone", address: "", isActive: true, createdAt: ts(110), updatedAt: ts(5) },
  { id: "loc-01-z2", name: "Zone B — Supplies", type: "zone", parentId: "loc-01", description: "Office and cleaning supplies", address: "", isActive: true, createdAt: ts(110), updatedAt: ts(5) },
  { id: "loc-01-z1-a1", name: "Aisle 1", type: "aisle", parentId: "loc-01-z1", description: "Cables and accessories", address: "", isActive: true, createdAt: ts(100), updatedAt: ts(5) },
  { id: "loc-01-z1-a2", name: "Aisle 2", type: "aisle", parentId: "loc-01-z1", description: "Peripherals", address: "", isActive: true, createdAt: ts(100), updatedAt: ts(5) },
  { id: "loc-01-z2-a1", name: "Aisle 3", type: "aisle", parentId: "loc-01-z2", description: "Paper and writing", address: "", isActive: true, createdAt: ts(100), updatedAt: ts(5) },
  // Downtown Store
  { id: "loc-02", name: "Downtown Store", type: "warehouse", parentId: null, description: "Retail storefront with stock", address: "200 Main St, Chicago IL", isActive: true, createdAt: ts(100), updatedAt: ts(10) },
  // Regional Office
  { id: "loc-03", name: "Regional Office", type: "warehouse", parentId: null, description: "Corporate office supplies", address: "300 Corporate Pkwy, Chicago IL", isActive: true, createdAt: ts(80), updatedAt: ts(20) },
];

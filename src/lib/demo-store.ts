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
import { MovementType } from "@/types/inventory";
import { generateSeedData, type SeedData } from "./demo/index";

export interface ItemFilters {
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  status?: string;
  search?: string;
}

export interface StockSummary {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "requestor";
  status: "active" | "inactive" | "pending";
  joinedAt: string;
}

const SEED_USERS: DemoUser[] = [
  { id: "user-01", name: "Alice Chen", email: "alice@stackwise.io", role: "admin", status: "active", joinedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "user-02", name: "Bob Martinez", email: "bob@stackwise.io", role: "admin", status: "active", joinedAt: new Date(Date.now() - 80 * 86400000).toISOString() },
  { id: "user-03", name: "Carol Kim", email: "carol@stackwise.io", role: "manager", status: "active", joinedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "user-04", name: "David Okafor", email: "david@stackwise.io", role: "manager", status: "active", joinedAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "user-05", name: "Eva Novak", email: "eva@stackwise.io", role: "requestor", status: "active", joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
];

export class DemoStore {
  private data: SeedData;
  private version = 0;
  private users: DemoUser[] = SEED_USERS.map((u) => ({ ...u }));

  constructor() {
    this.data = generateSeedData();
  }

  getVersion() {
    return this.version;
  }

  reset() {
    this.data = generateSeedData();
    this.users = SEED_USERS.map((u) => ({ ...u }));
    this.version++;
  }

  // ─── Users ─────────────────────────────────────────────
  getUsers(): DemoUser[] { return [...this.users]; }

  addUser(user: DemoUser): void { this.users.push(user); this.version++; }

  updateUser(id: string, updates: Partial<DemoUser>): void {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) { this.users[idx] = { ...this.users[idx], ...updates }; this.version++; }
  }

  getAdminCount(): number {
    return this.users.filter((u) => u.role === "admin" && u.status === "active").length;
  }

  // ─── Categories ────────────────────────────────────────
  getCategories(): Category[] {
    return this.data.categories;
  }

  createCategory(category: Category): Category {
    this.data.categories.push(category);
    this.version++;
    return category;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.version++;
    return this.data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const len = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    // Unlink items from deleted category
    for (const item of this.data.items) {
      if (item.categoryId === id) item.categoryId = null;
    }
    if (this.data.categories.length < len) { this.version++; return true; }
    return false;
  }

  // ─── Settings (reorder defaults) ──────────────────────
  private reorderDefaults = { reorderPoint: 10, leadTimeDays: 7, safetyMultiplier: 1.5, orderQuantity: 25 };

  getReorderDefaults() {
    return { ...this.reorderDefaults };
  }

  setReorderDefaults(defaults: typeof this.reorderDefaults): void {
    this.reorderDefaults = { ...defaults };
    this.version++;
  }

  // ─── Custom Field Definitions ─────────────────────────
  private customFieldDefs: import("@/types/inventory").CustomFieldDefinition[] = [];

  getCustomFieldDefs() {
    return [...this.customFieldDefs];
  }

  addCustomFieldDef(def: import("@/types/inventory").CustomFieldDefinition): void {
    this.customFieldDefs.push(def);
    this.version++;
  }

  updateCustomFieldDef(id: string, updates: Partial<import("@/types/inventory").CustomFieldDefinition>): void {
    const idx = this.customFieldDefs.findIndex((d) => d.id === id);
    if (idx !== -1) { this.customFieldDefs[idx] = { ...this.customFieldDefs[idx], ...updates }; this.version++; }
  }

  deleteCustomFieldDef(id: string): void {
    this.customFieldDefs = this.customFieldDefs.filter((d) => d.id !== id);
    this.version++;
  }

  reorderCustomFieldDefs(ids: string[]): void {
    const map = new Map(this.customFieldDefs.map((d) => [d.id, d]));
    this.customFieldDefs = ids.map((id) => map.get(id)!).filter(Boolean);
    this.version++;
  }

  // ─── Items ─────────────────────────────────────────────
  getItems(filters?: ItemFilters): Item[] {
    let result = this.data.items;
    if (filters?.categoryId) result = result.filter((i) => i.categoryId === filters.categoryId);
    if (filters?.supplierId) result = result.filter((i) => i.supplierId === filters.supplierId);
    if (filters?.locationId) result = result.filter((i) => i.locationId === filters.locationId);
    if (filters?.status) result = result.filter((i) => i.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return result;
  }

  getItemById(id: string): Item | undefined {
    return this.data.items.find((i) => i.id === id);
  }

  createItem(item: Item): Item {
    this.data.items.push(item);
    this.version++;
    return item;
  }

  updateItem(id: string, updates: Partial<Item>): Item | undefined {
    const idx = this.data.items.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.items[idx] = { ...this.data.items[idx], ...updates, updatedAt: new Date().toISOString() };
    this.version++;
    return this.data.items[idx];
  }

  deleteItem(id: string): boolean {
    const len = this.data.items.length;
    this.data.items = this.data.items.filter((i) => i.id !== id);
    if (this.data.items.length < len) { this.version++; return true; }
    return false;
  }

  getStockSummary(): StockSummary {
    const items = this.data.items;
    return {
      total: items.length,
      inStock: items.filter((i) => i.currentStock > i.reorderPoint).length,
      lowStock: items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint).length,
      outOfStock: items.filter((i) => i.currentStock === 0).length,
    };
  }

  // ─── Movements ─────────────────────────────────────────
  getMovements(): StockMovement[] {
    return this.data.movements;
  }

  getRecentMovements(limit: number): StockMovement[] {
    return [...this.data.movements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  createMovement(movement: StockMovement): StockMovement {
    this.data.movements.push(movement);
    // Update item quantity
    const item = this.data.items.find((i) => i.id === movement.itemId);
    if (item) {
      if (movement.type === MovementType.Received) {
        item.currentStock += Math.abs(movement.quantity);
      } else if (movement.type === MovementType.Shipped) {
        item.currentStock = Math.max(0, item.currentStock - Math.abs(movement.quantity));
      } else if (movement.type === MovementType.Adjusted) {
        item.currentStock = Math.max(0, item.currentStock + movement.quantity);
      } else if (movement.type === MovementType.Transferred) {
        // Transfer doesn't change total stock, just location
        if (movement.toLocationId) {
          item.locationId = movement.toLocationId;
        }
      }
    }
    this.version++;
    return movement;
  }

  // ─── Suppliers ─────────────────────────────────────────
  getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id === id);
  }

  createSupplier(supplier: Supplier): Supplier {
    this.data.suppliers.push(supplier);
    this.version++;
    return supplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): Supplier | undefined {
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
    this.version++;
    return this.data.suppliers[idx];
  }

  deleteSupplier(id: string): boolean {
    const len = this.data.suppliers.length;
    this.data.suppliers = this.data.suppliers.filter((s) => s.id !== id);
    if (this.data.suppliers.length < len) { this.version++; return true; }
    return false;
  }

  // ─── Locations ─────────────────────────────────────────
  getLocations(): Location[] {
    return this.data.locations;
  }

  getLocationById(id: string): Location | undefined {
    return this.data.locations.find((l) => l.id === id);
  }

  createLocation(location: Location): Location {
    this.data.locations.push(location);
    this.version++;
    return location;
  }

  updateLocation(id: string, updates: Partial<Location>): Location | undefined {
    const idx = this.data.locations.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    this.data.locations[idx] = { ...this.data.locations[idx], ...updates };
    this.version++;
    return this.data.locations[idx];
  }

  deleteLocation(id: string): boolean {
    const len = this.data.locations.length;
    this.data.locations = this.data.locations.filter((l) => l.id !== id);
    if (this.data.locations.length < len) { this.version++; return true; }
    return false;
  }

  // ─── Purchase Orders ───────────────────────────────────
  getPurchaseOrders(): PurchaseOrder[] {
    return this.data.purchaseOrders;
  }

  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.data.purchaseOrders.find((po) => po.id === id);
  }

  createPurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    this.data.purchaseOrders.push(po);
    this.version++;
    return po;
  }

  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | undefined {
    const idx = this.data.purchaseOrders.findIndex((po) => po.id === id);
    if (idx === -1) return undefined;
    this.data.purchaseOrders[idx] = { ...this.data.purchaseOrders[idx], ...updates };
    this.version++;
    return this.data.purchaseOrders[idx];
  }

  deletePurchaseOrder(id: string): boolean {
    const idx = this.data.purchaseOrders.findIndex((po) => po.id === id);
    if (idx === -1) return false;
    this.data.purchaseOrders.splice(idx, 1);
    this.version++;
    return true;
  }

  // ─── Requests ──────────────────────────────────────────
  getRequests(): InventoryRequest[] {
    return this.data.requests;
  }

  getRequestById(id: string): InventoryRequest | undefined {
    return this.data.requests.find((r) => r.id === id);
  }

  createRequest(request: InventoryRequest): InventoryRequest {
    this.data.requests.push(request);
    this.version++;
    return request;
  }

  updateRequest(id: string, updates: Partial<InventoryRequest>): InventoryRequest | undefined {
    const idx = this.data.requests.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.data.requests[idx] = { ...this.data.requests[idx], ...updates };
    this.version++;
    return this.data.requests[idx];
  }

  // ─── Notifications ────────────────────────────────────
  getNotifications(): Notification[] {
    return [...this.data.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getUnreadCount(): number {
    return this.data.notifications.filter((n) => !n.isRead).length;
  }

  markAsRead(id: string): void {
    const n = this.data.notifications.find((n) => n.id === id);
    if (n) { n.isRead = true; this.version++; }
  }

  markAllAsRead(): void {
    this.data.notifications.forEach((n) => { n.isRead = true; });
    this.version++;
  }

  dismissNotification(id: string): void {
    this.data.notifications = this.data.notifications.filter((n) => n.id !== id);
    this.version++;
  }

  addNotification(notification: Notification): void {
    this.data.notifications.push(notification);
    this.version++;
  }

  // ─── Notification Preferences ─────────────────────────
  getNotificationPrefs() {
    return this.data.notificationPrefs;
  }

  setNotificationPrefs(prefs: typeof this.data.notificationPrefs): void {
    this.data.notificationPrefs = { ...prefs };
    this.version++;
  }
}

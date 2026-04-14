// ─── Finance Types ───────────────────────────────────────

export interface Expense {
  id: string;
  date: string;
  amount: number; // in NGN
  category: ExpenseCategory;
  notes: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "rent"
  | "transport"
  | "supplies"
  | "utilities"
  | "salaries"
  | "maintenance"
  | "other";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "transport", label: "Transport" },
  { value: "supplies", label: "Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "salaries", label: "Salaries" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export interface Refund {
  id: string;
  saleId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  amountNgn: number;
  reason: RefundReason;
  notes: string;
  createdAt: string;
}

export type RefundReason = "damaged" | "defective" | "wrong_item" | "customer_return" | "other";

export const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "defective", label: "Defective" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "customer_return", label: "Customer Return" },
  { value: "other", label: "Other" },
];

export interface CreditCustomer {
  id: string;
  customerName: string;
  customerPhone: string;
  balanceNgn: number; // positive = they owe
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  type: "credit" | "payment";
  amountNgn: number;
  saleId?: string;
  notes: string;
  createdAt: string;
}

export interface Discount {
  type: "percentage" | "flat";
  value: number; // percentage (0-100) or flat NGN amount
  reason?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  isActive: boolean;
  usageCount: number;
  maxUses: number | null;
  createdAt: string;
}

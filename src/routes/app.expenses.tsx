import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Receipt, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import type { Expense, ExpenseCategory } from "@/types/finance";
import { EXPENSE_CATEGORIES } from "@/types/finance";

const NAIRA = "₦";

export const Route = createFileRoute("/app/expenses")({
  component: ExpensesPage,
  head: () => ({ meta: [{ title: "Expenses — Stackwise" }] }),
});

function ExpensesPage() {
  const { demoStore, bumpVersion, version } = useDemo();
  const [formOpen, setFormOpen] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");

  const expenses = useMemo(() => {
    void version;
    return demoStore?.getExpenses() ?? [];
  }, [demoStore, version]);

  const filtered = filterCat === "all" ? expenses : expenses.filter((e) => e.category === filterCat);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const day = new Date(e.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
      const arr = map.get(day) ?? [];
      arr.push(e);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);
  const thisWeek = filtered.filter((e) => new Date().getTime() - new Date(e.date).getTime() < 7 * 86400000);
  const weeklyTotal = thisWeek.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto max-w-[1000px] space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track daily business expenses</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-xl font-bold font-mono">{NAIRA}{totalExpenses.toLocaleString("en-NG")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-xl font-bold font-mono">{NAIRA}{weeklyTotal.toLocaleString("en-NG")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Entries</p>
          <p className="text-xl font-bold font-mono">{filtered.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expense list grouped by day */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Receipt className="h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No expenses recorded</p>
          <p className="text-xs">Add your first expense to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, exps]) => (
            <div key={day}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{day}</p>
                <p className="text-xs font-mono font-medium text-foreground">
                  {NAIRA}{exps.reduce((s, e) => s + e.amount, 0).toLocaleString("en-NG")}
                </p>
              </div>
              <div className="space-y-1.5">
                {exps.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                      {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{e.category.replace("_", " ")}</p>
                      {e.notes && <p className="text-xs text-muted-foreground truncate">{e.notes}</p>}
                    </div>
                    <p className="text-sm font-bold font-mono">{NAIRA}{e.amount.toLocaleString("en-NG")}</p>
                    <button
                      type="button"
                      onClick={() => {
                        demoStore?.deleteExpense(e.id);
                        bumpVersion();
                        toast.success("Expense deleted");
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseFormSheet open={formOpen} onOpenChange={setFormOpen} demoStore={demoStore} bumpVersion={bumpVersion} />
    </div>
  );
}

function ExpenseFormSheet({ open, onOpenChange, demoStore, bumpVersion }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  demoStore: ReturnType<typeof useDemo>["demoStore"];
  bumpVersion: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    if (!amount || !demoStore) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      date,
      amount: Number(amount),
      category,
      notes,
      createdAt: new Date().toISOString(),
    };
    demoStore.addExpense(expense);
    bumpVersion();
    toast.success(`Expense recorded: ${NAIRA}${Number(amount).toLocaleString("en-NG")}`);
    onOpenChange(false);
    setAmount("");
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Expense</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ({NAIRA})</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" />
          </div>
          <Button onClick={handleSubmit} disabled={!amount} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

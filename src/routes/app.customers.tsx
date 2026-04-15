import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search, User, Phone, ShoppingBag, MessageCircle, Send,
  TrendingUp, AlertTriangle, Clock, Filter, CheckSquare, X,
} from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

const NAIRA = "₦";

export const Route = createFileRoute("/app/customers")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers — Stackwise" }] }),
});

interface CustomerRecord {
  name: string;
  phone: string;
  totalSpent: number;
  transactionCount: number;
  lastPurchase: string;
  debtBalance: number;
}

type CustomerTab = "all" | "frequent" | "high-spenders" | "debtors" | "inactive";

const MESSAGE_TEMPLATES = [
  { id: "receipt", label: "Receipt / Thank You", text: "Hi {name}, thank you for shopping with us! Your total was {amount}. We appreciate your business. 🙏" },
  { id: "followup", label: "Follow-Up", text: "Hi {name}, hope you're enjoying your recent purchase! We have new arrivals you might like. Visit us today! 🛍️" },
  { id: "debt", label: "Debt Reminder", text: "Hi {name}, this is a friendly reminder that you have an outstanding balance of {debt}. Kindly settle at your earliest convenience. Thank you! 🙏" },
  { id: "promo", label: "Promotion", text: "Hi {name}, we have a special offer just for you! Use code WELCOME10 for 10% off your next purchase. Don't miss out! 🎉" },
];

function CustomersPage() {
  const { demoStore } = useDemo();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CustomerTab>("all");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageTarget, setMessageTarget] = useState<CustomerRecord | null>(null);

  const customers = useMemo(() => {
    const sales = demoStore?.getSales() ?? [];
    const creditCustomers = demoStore?.getCreditCustomers() ?? [];
    const debtMap = new Map<string, number>();
    for (const cc of creditCustomers) {
      if (cc.balanceNgn > 0) debtMap.set(cc.customerPhone, cc.balanceNgn);
    }

    const map = new Map<string, CustomerRecord>();
    for (const sale of sales) {
      const phone = sale.customerPhone?.trim();
      if (!phone) continue;
      const existing = map.get(phone);
      if (existing) {
        existing.totalSpent += sale.totalNgn;
        existing.transactionCount++;
        if (sale.createdAt > existing.lastPurchase) {
          existing.lastPurchase = sale.createdAt;
          if (sale.customerName) existing.name = sale.customerName;
        }
      } else {
        map.set(phone, {
          name: sale.customerName || "Unknown",
          phone,
          totalSpent: sale.totalNgn,
          transactionCount: 1,
          lastPurchase: sale.createdAt,
          debtBalance: 0,
        });
      }
    }
    for (const [phone, debt] of debtMap) {
      const c = map.get(phone);
      if (c) c.debtBalance = debt;
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [demoStore]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const filtered = useMemo(() => {
    let list = customers;
    if (tab === "frequent") list = list.filter((c) => c.transactionCount >= 3);
    if (tab === "high-spenders") list = list.filter((c) => c.totalSpent >= 50_000);
    if (tab === "debtors") list = list.filter((c) => c.debtBalance > 0);
    if (tab === "inactive") list = list.filter((c) => c.lastPurchase < thirtyDaysAgo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  }, [customers, tab, search, thirtyDaysAgo]);

  const stats = useMemo(() => ({
    total: customers.length,
    frequent: customers.filter((c) => c.transactionCount >= 3).length,
    debtors: customers.filter((c) => c.debtBalance > 0).length,
    totalDebt: customers.reduce((s, c) => s + c.debtBalance, 0),
  }), [customers]);

  const toggleSelect = (phone: string) => {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const openWhatsApp = (phone: string, text: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const intlPhone = cleaned.startsWith("0") ? `234${cleaned.slice(1)}` : cleaned;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleSendMessage = (customer: CustomerRecord) => {
    setMessageTarget(customer);
    const tpl = MESSAGE_TEMPLATES[0];
    setMessageText(tpl.text.replace("{name}", customer.name).replace("{amount}", `${NAIRA}${customer.totalSpent.toLocaleString("en-NG")}`).replace("{debt}", `${NAIRA}${customer.debtBalance.toLocaleString("en-NG")}`));
    setMessageOpen(true);
  };

  const handleBulkMessage = () => {
    if (selectedCustomers.size === 0) { toast.error("Select customers first"); return; }
    setMessageTarget(null);
    setMessageText(MESSAGE_TEMPLATES[1].text);
    setMessageOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (messageTarget) {
      openWhatsApp(messageTarget.phone, messageText);
    } else {
      const targets = customers.filter((c) => selectedCustomers.has(c.phone));
      for (const c of targets) {
        const text = messageText.replace("{name}", c.name).replace("{amount}", `${NAIRA}${c.totalSpent.toLocaleString("en-NG")}`).replace("{debt}", `${NAIRA}${c.debtBalance.toLocaleString("en-NG")}`);
        openWhatsApp(c.phone, text);
      }
    }
    setMessageOpen(false);
    toast.success("WhatsApp opened — send manually");
  };

  const daysSince = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer directory and send messages</p>
        </div>
        {selectedCustomers.size > 0 && (
          <Button onClick={handleBulkMessage} className="gap-2">
            <Send className="h-4 w-4" />
            Message {selectedCustomers.size} selected
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Customers</p>
          <p className="text-xl font-bold font-mono">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Frequent Buyers</p>
          <p className="text-xl font-bold font-mono text-primary">{stats.frequent}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Debtors</p>
          <p className="text-xl font-bold font-mono text-destructive">{stats.debtors}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Debt</p>
          <p className="text-xl font-bold font-mono text-destructive">{NAIRA}{stats.totalDebt.toLocaleString("en-NG")}</p>
        </Card>
      </div>

      {/* Tabs and search */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as CustomerTab)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-5 sm:w-auto">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="frequent" className="text-xs">Frequent</TabsTrigger>
            <TabsTrigger value="high-spenders" className="text-xs">Top</TabsTrigger>
            <TabsTrigger value="debtors" className="text-xs">Debtors</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">Inactive</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone…" className="pl-9" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-3">
          {filtered.length === 0 ? (
            <EmptyState icon={User} title="No customers found" description="Complete sales with customer phone numbers to build your directory." />
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div
                  key={c.phone}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                >
                  <button type="button" onClick={() => toggleSelect(c.phone)} className="shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${selectedCustomers.has(c.phone) ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      {selectedCustomers.has(c.phone) ? <CheckSquare className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />{c.phone}
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShoppingBag className="h-3 w-3" />{c.transactionCount} sales
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{daysSince(c.lastPurchase)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold font-mono">{NAIRA}{c.totalSpent.toLocaleString("en-NG")}</p>
                    {c.debtBalance > 0 && (
                      <p className="text-xs text-destructive font-mono">Owes {NAIRA}{c.debtBalance.toLocaleString("en-NG")}</p>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => handleSendMessage(c)} className="shrink-0 h-9 w-9 text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* WhatsApp Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Send WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              {messageTarget ? `To: ${messageTarget.name} (${messageTarget.phone})` : `To: ${selectedCustomers.size} customers`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    let text = tpl.text;
                    if (messageTarget) {
                      text = text.replace("{name}", messageTarget.name)
                        .replace("{amount}", `${NAIRA}${messageTarget.totalSpent.toLocaleString("en-NG")}`)
                        .replace("{debt}", `${NAIRA}${messageTarget.debtBalance.toLocaleString("en-NG")}`);
                    }
                    setMessageText(text);
                  }}
                >
                  {tpl.label}
                </Button>
              ))}
            </div>

            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
              placeholder="Type your message…"
            />

            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSendWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

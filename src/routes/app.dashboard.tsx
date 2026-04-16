import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Package, CheckCircle2, AlertTriangle, XCircle, ChevronDown, DollarSign, Users, TrendingUp, ShoppingCart, TrendingDown, Receipt, Clock, Store } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StockStatusDonut, CategoryDonut } from "@/components/dashboard/StockDonutChart";
import { DashboardReorderSection } from "@/components/insights/DashboardReorderSection";
import { DashboardAnomalySection } from "@/components/insights/DashboardAnomalySection";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { cn } from "@/lib/utils";

import { useStockSummary } from "@/hooks/useInventoryData";
import { useAlertGenerator } from "@/hooks/useStockAlertGenerator";
import { useDemo } from "@/hooks/useDemo";
import { useRole } from "@/hooks/useRole";
import { useOnboarding, type TourStep } from "@/hooks/useOnboarding";

const NAIRA = "₦";
const USD_TO_NGN = 1_580;

const TOUR_STEPS: TourStep[] = [
  { title: "Welcome to Stackwise!", description: "Let's take a quick tour of all the key features. This will only take a minute." },
  { target: "sidebar", title: "Navigation", description: "Use the sidebar to switch between sections — sales, catalog, customers, analytics, and more." },
  { target: "metrics", title: "Business overview", description: "Your key metrics at a glance — revenue, profit, expenses, and customer counts." },
  { target: "needs-attention", title: "Alerts & activity", description: "Items that need action appear here — low stock, overdue POs, and pending requests." },
  { target: "search", title: "Quick search", description: "Press CMD+K (or Ctrl+K) to search anything — items, suppliers, orders, and more." },
  { title: "Sales & POS", description: "Head to Sales to ring up orders, apply discounts, accept multiple payment methods, and send receipts via WhatsApp." },
  { title: "Customers", description: "The Customers page shows purchase history, debt tracking, and lets you message customers directly via WhatsApp." },
  { title: "Settings", description: "Admins can configure store branding, smart features, staff roles, and launch this tour again from Settings > Help." },
  { title: "You're all set!", description: "Explore freely! You can restart this tour anytime from Settings > Help." },
];

interface AccordionSectionProps {
  id: string;
  title: string;
  openSection: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  dataTour?: string;
}

function AccordionSection({ id, title, openSection, onToggle, children, dataTour }: AccordionSectionProps) {
  const isOpen = openSection === id;
  return (
    <div data-tour={dataTour} className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div className={cn("transition-all duration-200 ease-in-out", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — Stackwise" }] }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary } = useStockSummary();
  const { demoStore, isDemo, onboarding } = useDemo();
  const { isAdmin, isManager } = useRole();
  useAlertGenerator();

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];
  const suppliers = demoStore?.getSuppliers() ?? [];
  const sales = demoStore?.getSales() ?? [];
  const users = demoStore?.getUsers() ?? [];

  const tour = useOnboarding("dashboard");
  const [openSection, setOpenSection] = useState<string | null>("metrics");

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (isDemo && !tour.hasCompleted) {
      const timer = setTimeout(() => tour.startTour(), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, tour.hasCompleted]);

  const handleTourComplete = () => {
    tour.completeTour();
    toast.success("Tour complete! Explore freely or start the walkthrough.");
  };


  // Sales metrics
  const totalRevenue = sales.reduce((s, sale) => s + sale.totalNgn, 0);
  const todaySales = sales.filter((s) => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.totalNgn, 0);
  const uniqueCustomers = new Set(sales.filter((s) => s.customerPhone).map((s) => s.customerPhone)).size;

  // Expense & refund metrics
  const allExpenses = demoStore?.getExpenses() ?? [];
  const allRefunds = demoStore?.getRefunds() ?? [];
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRefunds = allRefunds.reduce((s, r) => s + r.amountNgn, 0);
  const netProfit = totalRevenue - totalExpenses - totalRefunds;
  const todayExpenses = allExpenses.filter((e) => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const storeName = onboarding.businessType
    ? onboarding.businessType.charAt(0).toUpperCase() + onboarding.businessType.slice(1) + " Store"
    : "NEXA StoreOS";

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Store className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">{storeName}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Admin Dashboard" : "Manager Dashboard"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 justify-end">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {currentTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentTime.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {onboarding.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Categories:</span>
          {onboarding.categories.map((cat) => (
            <span key={cat} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
              {cat.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* ─── Admin Dashboard ─── */}
      {isAdmin && (
        <>
          <AccordionSection id="metrics" title="Business Overview" openSection={openSection} onToggle={toggleSection} dataTour="metrics">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={() => navigate({ to: "/app/sales-analytics" })} className="text-left"><MetricCard label="Total Revenue" value={`${NAIRA}${totalRevenue.toLocaleString("en-NG")}`} accentColor="healthy" icon={DollarSign} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/sales-analytics" })} className="text-left"><MetricCard label="Net Profit" value={`${NAIRA}${netProfit.toLocaleString("en-NG")}`} accentColor={netProfit >= 0 ? "healthy" : "danger"} icon={netProfit >= 0 ? TrendingUp : TrendingDown} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/expenses" })} className="text-left"><MetricCard label="Expenses" value={`${NAIRA}${totalExpenses.toLocaleString("en-NG")}`} accentColor="warning" icon={Receipt} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/customers" })} className="text-left"><MetricCard label="Unique Customers" value={uniqueCustomers} accentColor="neutral" icon={Users} /></button>
            </div>
          </AccordionSection>

          <AccordionSection id="stock" title="Stock Health" openSection={openSection} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total SKUs" value={summary.total} accentColor="neutral" icon={Package} />
              <MetricCard label="In stock" value={summary.inStock} accentColor="healthy" icon={CheckCircle2} />
              <MetricCard label="Low stock" value={summary.lowStock} accentColor="warning" icon={AlertTriangle} />
              <MetricCard label="Out of stock" value={summary.outOfStock} accentColor="danger" icon={XCircle} />
            </div>
          </AccordionSection>

          <AccordionSection id="charts" title="Stock Distribution" openSection={openSection} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StockStatusDonut />
              <CategoryDonut />
            </div>
          </AccordionSection>

          <AccordionSection id="attention" title="Staff Activity & Alerts" openSection={openSection} onToggle={toggleSection} dataTour="needs-attention">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="min-h-0"><NeedsAttention /></div>
              <div className="min-h-0"><RecentActivity /></div>
            </div>
          </AccordionSection>

          <AccordionSection id="anomalies" title="Anomaly Detection" openSection={openSection} onToggle={toggleSection}>
            <DashboardAnomalySection movements={movements} items={items} />
          </AccordionSection>

          <AccordionSection id="reorder" title="Reorder Suggestions" openSection={openSection} onToggle={toggleSection}>
            <DashboardReorderSection items={items} movements={movements} suppliers={suppliers} />
          </AccordionSection>
        </>
      )}

      {/* ─── Manager Dashboard ─── */}
      {isManager && (
        <>
          <AccordionSection id="metrics" title="Today's Performance" openSection={openSection} onToggle={toggleSection} dataTour="metrics">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={() => navigate({ to: "/app/sales-analytics" })} className="text-left"><MetricCard label="Today's Revenue" value={`${NAIRA}${todayRevenue.toLocaleString("en-NG")}`} accentColor="healthy" icon={DollarSign} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/sales-history" })} className="text-left"><MetricCard label="Today's Orders" value={todaySales.length} accentColor="neutral" icon={ShoppingCart} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/expenses" })} className="text-left"><MetricCard label="Today's Expenses" value={`${NAIRA}${todayExpenses.toLocaleString("en-NG")}`} accentColor="warning" icon={Receipt} /></button>
              <button type="button" onClick={() => navigate({ to: "/app/sales-analytics" })} className="text-left"><MetricCard label="Net Today" value={`${NAIRA}${(todayRevenue - todayExpenses).toLocaleString("en-NG")}`} accentColor={todayRevenue - todayExpenses >= 0 ? "healthy" : "danger"} icon={todayRevenue - todayExpenses >= 0 ? TrendingUp : TrendingDown} /></button>
            </div>
          </AccordionSection>

          <AccordionSection id="charts" title="Inventory Overview" openSection={openSection} onToggle={toggleSection}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StockStatusDonut />
              <CategoryDonut />
            </div>
          </AccordionSection>

          <AccordionSection id="attention" title="Needs Attention" openSection={openSection} onToggle={toggleSection} dataTour="needs-attention">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="min-h-0"><NeedsAttention /></div>
              <div className="min-h-0"><RecentActivity /></div>
            </div>
          </AccordionSection>

          <AccordionSection id="reorder" title="Reorder Suggestions" openSection={openSection} onToggle={toggleSection}>
            <DashboardReorderSection items={items} movements={movements} suppliers={suppliers} />
          </AccordionSection>
        </>
      )}

      {/* ─── Requestor fallback ─── */}
      {!isAdmin && !isManager && (
        <>
          <AccordionSection id="metrics" title="Stock Overview" openSection={openSection} onToggle={toggleSection} dataTour="metrics">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total SKUs" value={summary.total} accentColor="neutral" icon={Package} />
              <MetricCard label="In stock" value={summary.inStock} accentColor="healthy" icon={CheckCircle2} />
              <MetricCard label="Low stock" value={summary.lowStock} accentColor="warning" icon={AlertTriangle} />
              <MetricCard label="Out of stock" value={summary.outOfStock} accentColor="danger" icon={XCircle} />
            </div>
          </AccordionSection>
        </>
      )}

      <OnboardingTour
        steps={TOUR_STEPS}
        currentStep={tour.currentStep}
        isActive={tour.isActive}
        onNext={tour.next}
        onBack={tour.back}
        onSkip={tour.skipTour}
        onComplete={handleTourComplete}
      />
    </div>
  );
}

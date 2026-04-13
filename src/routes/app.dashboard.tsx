import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
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
import { useOnboarding, type TourStep } from "@/hooks/useOnboarding";

const TOUR_STEPS: TourStep[] = [
  { title: "Welcome to Stackwise!", description: "Let's take a quick tour of the key features. This will only take a minute." },
  { target: "sidebar", title: "Navigation", description: "Use the sidebar to switch between sections — catalog, movements, suppliers, and more." },
  { target: "metrics", title: "Stock health", description: "Your inventory health at a glance — total SKUs, in-stock, low-stock, and out-of-stock counts." },
  { target: "needs-attention", title: "Needs attention", description: "Items that need action appear here — low stock, overdue POs, and pending requests." },
  { target: "search", title: "Command palette", description: "Press CMD+K (or Ctrl+K) to search anything — items, suppliers, orders, and more." },
  { title: "You're all set!", description: "Explore the app or try the guided walkthrough to learn the core workflow. Happy managing!" },
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
  const { data: summary } = useStockSummary();
  const { demoStore, isDemo } = useDemo();
  useAlertGenerator();

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];
  const suppliers = demoStore?.getSuppliers() ?? [];

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

  const { onboarding } = useDemo();

  const businessLabel = onboarding.businessType
    ? onboarding.businessType.charAt(0).toUpperCase() + onboarding.businessType.slice(1)
    : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {businessLabel
            ? `${businessLabel} inventory overview`
            : "Welcome back — here's your inventory overview."}
        </p>
      </div>

      {onboarding.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Your categories:</span>
          {onboarding.categories.map((cat) => (
            <span key={cat} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
              {cat.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Accordion sections — only one open at a time */}
      <AccordionSection id="metrics" title="Stock Health" openSection={openSection} onToggle={toggleSection} dataTour="metrics">
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

      <AccordionSection id="attention" title="Needs Attention & Activity" openSection={openSection} onToggle={toggleSection} dataTour="needs-attention">
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

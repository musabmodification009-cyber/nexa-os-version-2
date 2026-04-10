import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDemo } from "@/hooks/useDemo";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useEffect } from "react";
import {
  Package,
  BarChart3,
  Bell,
  Truck,
  ScanLine,
  TrendingUp,
  Users,
  ArrowRight,
  Shield,
  Globe,
  Zap,
  Menu,
  X,
} from "lucide-react";
import heroBox3d from "@/assets/hero-box.png";
import uiScreenshot from "@/assets/ui-screenshot-dashboard-v2.png.asset.json";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Stackwise — Inventory Command Center" },
      {
        name: "description",
        content:
          "Real-time inventory management for businesses of any size. Track stock, manage suppliers, automate reorders, and keep your team aligned.",
      },
      { property: "og:title", content: "Stackwise — Inventory Command Center" },
      {
        property: "og:description",
        content:
          "Real-time inventory management for businesses of any size. Track stock, manage suppliers, automate reorders, and keep your team aligned.",
      },
    ],
  }),
});

/* ─── Data ──────────────────────────────────────────── */
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Analytics", href: "#analytics" },
];

const solutions = [
  {
    icon: BarChart3,
    title: "Real-time tracking",
    description: "Monitor stock levels across every location with live dashboards and instant status updates.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Bell,
    title: "Smart reorders",
    description: "Automated thresholds and AI-powered forecasting prevent stockouts before they happen.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Truck,
    title: "Supplier management",
    description: "Unified view of contacts, lead times, purchase history, and performance scoring.",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: TrendingUp,
    title: "Analytics & reports",
    description: "Turn movement data into insights with trend charts, turnover analysis, and exports.",
    color: "bg-primary/10 text-primary",
  },
];

const featureTabs = [
  {
    label: "Dashboard",
    description: "See what matters most: stock levels, pending orders, recent movements, and alerts that need attention.",
    image: uiScreenshot.url,
  },
  {
    label: "Catalog",
    description: "Powerful search, filters, bulk actions, and custom fields let you manage hundreds of SKUs effortlessly.",
    image: uiScreenshot.url,
  },
  {
    label: "Analytics",
    description: "From stock trends to supplier performance, turn raw data into actionable insights and forecasts.",
    image: uiScreenshot.url,
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Real-time tracking",
    description: "Monitor stock levels across every location as changes happen, with instant dashboards and live status indicators.",
  },
  {
    icon: Bell,
    title: "Smart reorder alerts",
    description: "Get notified before you run out. Automated thresholds and AI-powered forecasting keep shelves stocked.",
  },
  {
    icon: Truck,
    title: "Supplier management",
    description: "Organize contacts, lead times, and purchase history in one unified view with performance scoring.",
  },
  {
    icon: ScanLine,
    title: "Barcode scanning",
    description: "Speed up receiving and cycle counts with built-in barcode support and quick-entry mode.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & reports",
    description: "Turn movement data into insights with trend charts, turnover analysis, and exportable reports.",
  },
  {
    icon: Users,
    title: "Team roles & permissions",
    description: "Control who can view, edit, or approve with granular role-based access and approval workflows.",
  },
];

const capabilities = [
  { icon: Shield, text: "Role-based access" },
  { icon: Globe, text: "Multi-location support" },
  { icon: ScanLine, text: "Barcode ready" },
  { icon: Zap, text: "AI-powered insights" },
];

/* ─── Components ────────────────────────────────────── */

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function StickyNav({ onTryDemo }: { onTryDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 border-b border-border shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Stackwise</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA - secondary style */}
        <button
          type="button"
          onClick={onTryDemo}
          className="hidden items-center gap-2 rounded-lg border border-border bg-muted/60 px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted md:inline-flex"
        >
          Try demo
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onTryDemo();
            }}
            className="mt-2 w-full rounded-lg border border-border bg-muted/60 px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Try demo
          </button>
        </div>
      )}
    </nav>
  );
}

function BrowserFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-secondary/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-stock-healthy/60" />
      </div>
      {children}
    </div>
  );
}

function FeatureTabsSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="analytics" className="px-4 py-20 sm:py-28">
      <RevealSection className="text-center">
        <span className="inline-block rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Product tour
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Drive your business forward
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Explore the modules that give you complete control over your supply chain.
        </p>
      </RevealSection>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Tab list */}
        <div className="flex justify-center gap-2 overflow-x-auto lg:w-80 lg:shrink-0 lg:justify-start lg:flex-col lg:gap-3">
          {featureTabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`shrink-0 rounded-lg px-6 py-3 text-left text-sm font-medium transition-all lg:px-6 lg:py-4 ${
                activeTab === i
                  ? "bg-white text-foreground shadow-md ring-1 ring-border"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="block font-semibold">{tab.label}</span>
              <span
                className={`mt-1 hidden text-xs leading-relaxed lg:block text-muted-foreground`}
              >
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <BrowserFrame>
            <img
              src={featureTabs[activeTab].image}
              alt={`Stackwise ${featureTabs[activeTab].label} view`}
              className="w-full transition-opacity duration-300"
            />
          </BrowserFrame>
          <p className="mt-4 text-sm text-muted-foreground lg:hidden">
            {featureTabs[activeTab].description}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────── */
function LandingPage() {
  const { enterDemoMode } = useDemo();
  const navigate = useNavigate();

  const handleTryDemo = () => {
    enterDemoMode();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyNav onTryDemo={handleTryDemo} />

      {/* ── Split Hero ─────────────────────────────────── */}
      <section className="relative px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
            <img
              src={heroBox3d}
              alt="3D illustration of a cardboard box"
              className="mx-auto w-48 drop-shadow-xl sm:w-56"
            />
          </div>

          <h1 className="mt-5 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px] lg:text-[52px]">
            The inventory platform that scales your business
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Track stock, manage suppliers, automate reorders, and keep your
            team aligned from one powerful command center.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleTryDemo}
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              Try demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Solutions Grid ─────────────────────────────── */}
      <section id="solutions" className="rounded-none bg-muted/50 px-4 py-20 sm:py-28">
        <RevealSection className="text-center">
          <span className="inline-block rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Solutions
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Built for modern inventory teams
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Four powerful modules working together to give you complete visibility and control.
          </p>
        </RevealSection>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s, i) => (
            <RevealSection key={s.title} delay={i * 100} className="h-full">
              <div className="group h-full rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className={`mb-4 inline-flex rounded-lg p-3 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Product Showcase — Browser Frame ────────────── */}
      <section className="px-4 py-16">
        <RevealSection>
          <div className="mx-auto max-w-5xl">
            <BrowserFrame className="shadow-2xl shadow-primary/5">
              <img
                src={uiScreenshot.url}
                alt="Stackwise dashboard showing inventory metrics, stock levels chart, and recent activity"
                className="w-full"
                loading="lazy"
              />
            </BrowserFrame>
          </div>
        </RevealSection>
      </section>

      {/* ── Feature Tabs ───────────────────────────────── */}
      <FeatureTabsSection />

      {/* ── Feature Grid ─────────────────────────────── */}
      <section id="features" className="px-4 py-20 sm:py-28">
        <RevealSection className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to manage inventory
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Six powerful modules working together to give you complete control over your supply chain.
          </p>
        </RevealSection>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <RevealSection key={f.title} delay={i * 80}>
              <div className="group rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                <div className="mb-4 inline-flex rounded-md bg-primary p-2.5">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Capabilities Row ─────────────────────────── */}
      <section className="px-4 py-20">
        <RevealSection>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {capabilities.map((c) => (
              <div
                key={c.text}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{c.text}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl rounded-2xl bg-foreground px-6 py-16 text-center sm:px-12 sm:py-20">
          <RevealSection>
            <img src={heroBox3d} alt="" className="mx-auto mb-6 h-16 w-16 object-contain" />
            <h2 className="text-2xl font-semibold tracking-tight text-background sm:text-3xl lg:text-4xl">
              Ready to take control of your inventory?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-background/60">
              Explore Stackwise with sample data. No signup required.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={handleTryDemo}
                className="group inline-flex items-center gap-2 rounded-lg bg-background px-5 py-2.5 text-base font-semibold text-foreground shadow-lg transition-all hover:bg-background/90"
              >
                Try demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-border px-4 py-10 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4 text-primary" />
          <span>Built with Stackwise · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

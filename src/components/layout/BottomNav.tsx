import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, Package, ArrowLeftRight, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Sales", href: "/app/sales", icon: ShoppingCart },
  { label: "Catalog", href: "/app/catalog", icon: Package },
  { label: "Movements", href: "/app/movements", icon: ArrowLeftRight },
] as const;

export function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-border bg-card md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors min-h-[44px]",
              isActive(item.href) ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground min-h-[44px]"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] p-0">
          <SheetTitle className="sr-only">More navigation</SheetTitle>
          <Sidebar onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

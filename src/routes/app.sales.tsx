import { createFileRoute } from "@tanstack/react-router";
import { SalesGrid } from "@/components/sales/SalesGrid";

export const Route = createFileRoute("/app/sales")({
  component: SalesPage,
});

function SalesPage() {
  return (
    <div className="h-full">
      <SalesGrid />
    </div>
  );
}

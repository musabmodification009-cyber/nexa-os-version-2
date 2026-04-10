import { createFileRoute } from "@tanstack/react-router";
import { SalesHistoryPage } from "@/components/sales/SalesHistory";

export const Route = createFileRoute("/app/sales-history")({
  component: SalesHistoryPage,
  head: () => ({ meta: [{ title: "Sales History — Stackwise" }] }),
});

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  return <Navigate to="/app/dashboard" />;
}

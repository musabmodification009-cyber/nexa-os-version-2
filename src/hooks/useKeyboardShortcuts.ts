import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePermissions } from "@/hooks/usePermissions";

interface ShortcutDef {
  keys: [string, string];
  label: string;
  action: (navigate: ReturnType<typeof useNavigate>) => void;
  permission?: Parameters<ReturnType<typeof usePermissions>["can"]>[0];
  category: "navigate" | "create";
}

export const SHORTCUTS: ShortcutDef[] = [
  // Navigation: G then …
  { keys: ["g", "d"], label: "Go to Dashboard", action: (n) => n({ to: "/app/dashboard" }), category: "navigate" },
  { keys: ["g", "c"], label: "Go to Catalog", action: (n) => n({ to: "/app/catalog", search: {} }), category: "navigate" },
  { keys: ["g", "m"], label: "Go to Movements", action: (n) => n({ to: "/app/movements", search: { item: undefined } }), category: "navigate" },
  { keys: ["g", "s"], label: "Go to Suppliers", action: (n) => n({ to: "/app/suppliers" }), category: "navigate" },
  { keys: ["g", "p"], label: "Go to Purchase Orders", action: (n) => n({ to: "/app/purchase-orders", search: {} }), category: "navigate" },
  { keys: ["g", "r"], label: "Go to Requests", action: (n) => n({ to: "/app/requests", search: { request: undefined } }), category: "navigate" },
  // Create: N then …
  { keys: ["n", "i"], label: "New Item", action: (n) => n({ to: "/app/catalog", search: {} }), permission: "create_item", category: "create" },
  { keys: ["n", "m"], label: "New Movement", action: (n) => n({ to: "/app/movements", search: { item: undefined } }), permission: "log_movement", category: "create" },
  { keys: ["n", "p"], label: "New Purchase Order", action: (n) => n({ to: "/app/purchase-orders", search: {} }), permission: "create_po", category: "create" },
  { keys: ["n", "r"], label: "New Request", action: (n) => n({ to: "/app/requests", search: { request: undefined } }), permission: "create_request", category: "create" },
];

const SEQUENCE_TIMEOUT = 500;

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement).isContentEditable;
}

interface UseKeyboardShortcutsOptions {
  onHelpOpen: () => void;
}

export function useKeyboardShortcuts({ onHelpOpen }: UseKeyboardShortcutsOptions) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const firstKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSequence = useCallback(() => {
    firstKeyRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if modifier keys or inside inputs
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();

      // ? opens help
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        onHelpOpen();
        clearSequence();
        return;
      }

      // Second key of sequence
      if (firstKeyRef.current) {
        const first = firstKeyRef.current;
        clearSequence();

        const match = SHORTCUTS.find(
          (s) => s.keys[0] === first && s.keys[1] === key && (!s.permission || can(s.permission)),
        );
        if (match) {
          e.preventDefault();
          match.action(navigate);
        }
        return;
      }

      // First key of sequence — only if it starts a known combo
      if (key === "g" || key === "n") {
        firstKeyRef.current = key;
        timerRef.current = setTimeout(clearSequence, SEQUENCE_TIMEOUT);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearSequence();
    };
  }, [navigate, can, onHelpOpen, clearSequence]);
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelpDialog({ open, onOpenChange }: ShortcutsHelpDialogProps) {
  const navShortcuts = SHORTCUTS.filter((s) => s.category === "navigate");
  const createShortcuts = SHORTCUTS.filter((s) => s.category === "create");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Global */}
          <div>
            <h4 className="mb-2 font-medium text-muted-foreground">Global</h4>
            <div className="space-y-1">
              <ShortcutRow keys="⌘ K" label="Open command palette" />
              <ShortcutRow keys="?" label="Show this help" />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-2 font-medium text-muted-foreground">Navigation</h4>
            <div className="space-y-1">
              {navShortcuts.map((s) => (
                <ShortcutRow
                  key={s.keys.join("")}
                  keys={`${s.keys[0].toUpperCase()} → ${s.keys[1].toUpperCase()}`}
                  label={s.label}
                />
              ))}
            </div>
          </div>

          {/* Create */}
          <div>
            <h4 className="mb-2 font-medium text-muted-foreground">Create</h4>
            <div className="space-y-1">
              {createShortcuts.map((s) => (
                <ShortcutRow
                  key={s.keys.join("")}
                  keys={`${s.keys[0].toUpperCase()} → ${s.keys[1].toUpperCase()}`}
                  label={s.label}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span>{label}</span>
      <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
        {keys}
      </kbd>
    </div>
  );
}

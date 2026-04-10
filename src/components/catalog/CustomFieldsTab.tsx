import { useState, useCallback } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/hooks/usePermissions";
import { usePermissions } from "@/hooks/usePermissions";

interface CustomFieldsTabProps {
  customFields: Record<string, string | number | boolean>;
  onUpdate: (fields: Record<string, string | number | boolean>) => void;
}

function FieldInput({ value, onSave, onCancel }: { value: string | number | boolean; onSave: (v: string | number | boolean) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(String(value));

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <select
          value={String(value)}
          onChange={(e) => onSave(e.target.value === "true")}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type={typeof value === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-primary"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(typeof value === "number" ? Number(draft) : draft);
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSave(typeof value === "number" ? Number(draft) : draft)}>
        <Check className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}><X className="h-3 w-3" /></Button>
    </div>
  );
}

export function CustomFieldsTab({ customFields, onUpdate }: CustomFieldsTabProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { can } = usePermissions();
  const canEdit = can("edit_item");

  const entries = Object.entries(customFields);

  const handleSave = useCallback((key: string, value: string | number | boolean) => {
    onUpdate({ ...customFields, [key]: value });
    setEditingKey(null);
  }, [customFields, onUpdate]);

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No custom fields defined.</p>
        <PermissionGate permission="access_settings">
          <p className="mt-1 text-xs text-muted-foreground">Admins can add custom fields in Settings.</p>
        </PermissionGate>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">{key}</span>
          <div className="min-w-0 flex-1 text-right">
            {editingKey === key ? (
              <FieldInput value={value} onSave={(v) => handleSave(key, v)} onCancel={() => setEditingKey(null)} />
            ) : (
              <span
                className={`text-sm ${canEdit ? "cursor-pointer rounded px-1 py-0.5 hover:bg-muted" : ""}`}
                onClick={() => canEdit && setEditingKey(key)}
                role={canEdit ? "button" : undefined}
                tabIndex={canEdit ? 0 : undefined}
              >
                {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

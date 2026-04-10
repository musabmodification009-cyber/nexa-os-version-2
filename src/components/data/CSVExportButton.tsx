import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

interface CSVExportButtonProps<T> {
  data: T[];
  columns: CSVColumn<T>[];
  filename: string;
  label?: string;
}

function escapeCSV(value: string | number): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function CSVExportButton<T>({
  data,
  columns,
  filename,
  label = "Export CSV",
}: CSVExportButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(() => {
    setLoading(true);
    try {
      const header = columns.map((c) => escapeCSV(c.header)).join(",");
      const rows = data.map((row) =>
        columns.map((c) => escapeCSV(c.accessor(row))).join(","),
      );
      const csv = [header, ...rows].join("\n");

      // UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

      const date = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [data, columns, filename]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading || data.length === 0}
    >
      <Download className="mr-1.5 h-4 w-4" />
      {loading ? "Exporting…" : label}
    </Button>
  );
}

import { useState, useCallback, useMemo, useRef, type DragEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle, ChevronRight, ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  /** If true, value must be a valid number */
  numeric?: boolean;
}

export interface ValidatedRow {
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
}

export interface CSVImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ImportField[];
  /** Called with all valid rows to import. Returns { created, failed } counts. */
  onImport: (rows: Record<string, string>[]) => Promise<{ created: number; failed: number }>;
  entityName?: string;
  existingSkus?: string[];
  knownCategories?: string[];
  knownSuppliers?: string[];
}

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

// ─── CSV Parser ──────────────────────────────────────────

function parseCSV(text: string): ParsedCSV {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (current.length > 0 || lines.length > 0) {
        lines.push(current);
        current = "";
      }
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);

  function splitRow(line: string): string[] {
    const cols: string[] = [];
    let col = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { col += '"'; i++; }
        else q = !q;
      } else if (c === "," && !q) {
        cols.push(col.trim());
        col = "";
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xfeff) headerLine = headerLine.slice(1);

  const headers = splitRow(headerLine);
  const rows = lines.slice(1).map(splitRow).filter((r) => r.some((c) => c.length > 0));

  return { headers, rows };
}

// ─── Auto-mapping ────────────────────────────────────────

function autoMap(csvHeaders: string[], fields: ImportField[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    const normalised = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = csvHeaders.find((h) => {
      const n = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      return n === normalised || n.includes(normalised) || normalised.includes(n);
    });
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

// ─── Validation ──────────────────────────────────────────

function validateRows(
  mappedRows: Record<string, string>[],
  fields: ImportField[],
  existingSkus: string[],
  knownCategories: string[],
  knownSuppliers: string[],
): ValidatedRow[] {
  const seenSkus = new Set<string>(existingSkus.map((s) => s.toLowerCase()));
  const fileSkus = new Set<string>();
  const catSet = new Set(knownCategories.map((c) => c.toLowerCase()));
  const supSet = new Set(knownSuppliers.map((s) => s.toLowerCase()));

  return mappedRows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    for (const f of fields) {
      if (f.required && !row[f.key]?.trim()) {
        errors.push(`Missing required field: ${f.label}`);
      }
    }

    // Numeric validation
    for (const f of fields) {
      if (f.numeric && row[f.key]?.trim()) {
        const v = Number(row[f.key]);
        if (isNaN(v)) errors.push(`${f.label} must be a number`);
      }
    }

    // SKU uniqueness
    const sku = row.sku?.trim().toLowerCase();
    if (sku) {
      if (seenSkus.has(sku) || fileSkus.has(sku)) {
        errors.push("Duplicate SKU");
      } else {
        fileSkus.add(sku);
      }
    }

    // Category / supplier warnings
    const cat = row.category?.trim();
    if (cat && !catSet.has(cat.toLowerCase())) {
      warnings.push(`New category: "${cat}"`);
    }
    const sup = row.supplier?.trim();
    if (sup && !supSet.has(sup.toLowerCase())) {
      warnings.push(`New supplier: "${sup}"`);
    }

    return { data: row, errors, warnings };
  });
}

// ─── Step Indicator ──────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
            i + 1 === current
              ? "bg-primary text-primary-foreground"
              : i + 1 < current
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function CSVImportSheet({
  open,
  onOpenChange,
  fields,
  onImport,
  entityName = "items",
  existingSkus = [],
  knownCategories = [],
  knownSuppliers = [],
}: CSVImportSheetProps) {
  const [step, setStep] = useState(1);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ created: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4; // upload → mapping → validation → execute

  const reset = useCallback(() => {
    setStep(1);
    setParsed(null);
    setFileError(null);
    setFileName("");
    setMapping({});
    setIsDragOver(false);
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setFileError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Only .csv files are accepted.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File exceeds 5 MB limit.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const csv = parseCSV(text);
        if (csv.headers.length === 0) {
          setFileError("Could not detect any columns. Check the file format.");
          return;
        }
        setParsed(csv);
        setMapping(autoMap(csv.headers, fields));
        setStep(2);
      };
      reader.onerror = () => setFileError("Failed to read file.");
      reader.readAsText(file);
    },
    [fields],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const requiredFields = useMemo(() => fields.filter((f) => f.required), [fields]);

  const unmappedRequired = useMemo(() => {
    return requiredFields.filter((f) => !mapping[f.key]);
  }, [requiredFields, mapping]);

  const mappedRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const field of fields) {
        const csvHeader = mapping[field.key];
        if (csvHeader) {
          const idx = parsed.headers.indexOf(csvHeader);
          obj[field.key] = idx >= 0 ? (row[idx] ?? "") : "";
        }
      }
      return obj;
    });
  }, [parsed, mapping, fields]);

  // Validation (computed when on step 3)
  const validatedRows = useMemo(() => {
    if (step < 3) return [];
    return validateRows(mappedRows, fields, existingSkus, knownCategories, knownSuppliers);
  }, [step, mappedRows, fields, existingSkus, knownCategories, knownSuppliers]);

  const validCount = useMemo(() => validatedRows.filter((r) => r.errors.length === 0).length, [validatedRows]);
  const errorCount = useMemo(() => validatedRows.filter((r) => r.errors.length > 0).length, [validatedRows]);
  const warningCount = useMemo(() => validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length, [validatedRows]);

  // Preview columns: only mapped fields
  const previewFields = useMemo(() => fields.filter((f) => mapping[f.key]), [fields, mapping]);
  const previewRows = useMemo(() => validatedRows.slice(0, 20), [validatedRows]);

  const startImport = useCallback(async (rows: Record<string, string>[]) => {
    setStep(4);
    setIsImporting(true);
    setImportProgress(0);
    try {
      // Simulate progress ticks for UX (actual import is batch)
      const progressInterval = setInterval(() => {
        setImportProgress((p) => Math.min(p + 5, 90));
      }, 100);
      const result = await onImport(rows);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
    } catch {
      setImportResult({ created: 0, failed: rows.length });
    } finally {
      setIsImporting(false);
    }
  }, [onImport]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v && !isImporting) { reset(); onOpenChange(v); }
        else if (!isImporting) onOpenChange(v);
      }}
    >
      <SheetContent className="w-full sm:max-w-[600px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Import {entityName}</SheetTitle>
            <StepIndicator current={step} total={totalSteps} />
          </div>
          <SheetDescription>
            {step === 1 && "Upload a CSV file to import."}
            {step === 2 && "Map CSV columns to fields."}
            {step === 3 && "Review validation results before importing."}
            {step === 4 && (isImporting ? "Importing rows…" : "Import complete.")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-4">
          {/* ── Step 1: File Upload ── */}
          {step === 1 && (
            <>
              <div
                role="button"
                tabIndex={0}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drop a CSV file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">.csv only, max 5 MB</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>

              {fileError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fileError}
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Column Mapping ── */}
          {step === 2 && parsed && (
            <>
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">{fileName}</span>
                <span className="text-xs text-muted-foreground">
                  — {parsed.rows.length} rows, {parsed.headers.length} columns
                </span>
              </div>

              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-3 pr-4">
                  {fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <div className="flex w-[140px] shrink-0 items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {field.label}
                        </span>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            Required
                          </Badge>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />

                      <Select
                        value={mapping[field.key] ?? "__skip__"}
                        onValueChange={(v) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field.key]: v === "__skip__" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Skip" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip__">— Skip —</SelectItem>
                          {parsed.headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {unmappedRequired.length > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Required fields not mapped: {unmappedRequired.map((f) => f.label).join(", ")}
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Validation & Preview ── */}
          {step === 3 && (
            <>
              {/* Summary */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {validCount} valid
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                    <XCircle className="h-4 w-4" />
                    {errorCount} errors
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {warningCount} warnings
                  </div>
                )}
              </div>

              {/* Preview table */}
              <ScrollArea className="max-h-[45vh]">
                <div className="min-w-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        {previewFields.slice(0, 5).map((f) => (
                          <TableHead key={f.key} className="text-xs">{f.label}</TableHead>
                        ))}
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => {
                        const hasError = row.errors.length > 0;
                        const hasWarning = row.warnings.length > 0;
                        return (
                          <TableRow
                            key={idx}
                            className={hasError ? "bg-destructive/5" : hasWarning ? "bg-amber-500/5" : ""}
                          >
                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                            {previewFields.slice(0, 5).map((f) => (
                              <TableCell key={f.key} className="text-xs max-w-[120px] truncate">
                                {row.data[f.key] || "—"}
                              </TableCell>
                            ))}
                            <TableCell className="text-xs">
                              {hasError ? (
                                <span className="text-destructive" title={row.errors.join("; ")}>
                                  {row.errors[0]}
                                </span>
                              ) : hasWarning ? (
                                <span className="text-amber-600 dark:text-amber-400" title={row.warnings.join("; ")}>
                                  {row.warnings[0]}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              {validatedRows.length > 20 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing first 20 of {validatedRows.length} rows
                </p>
              )}
            </>
          )}

          {/* ── Step 4: Execution ── */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-6 py-8">
              {isImporting ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="w-full max-w-xs">
                    <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                      <span>Importing…</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-200"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : importResult ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-foreground">Import Complete</p>
                    <p className="text-sm text-muted-foreground">
                      {importResult.created} {entityName} created
                      {importResult.failed > 0 && `, ${importResult.failed} failed`}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {step > 1 && step < 4 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step === 2 && (
            <Button
              size="sm"
              disabled={unmappedRequired.length > 0}
              onClick={() => setStep(3)}
            >
              Validate
            </Button>
          )}

          {step === 3 && (
            <div className="flex items-center gap-2">
              {errorCount > 0 && validCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const validRows = validatedRows
                      .filter((r) => r.errors.length === 0)
                      .map((r) => r.data);
                    startImport(validRows);
                  }}
                >
                  Import {validCount} Valid Rows
                </Button>
              )}
              {validCount > 0 && errorCount === 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const validRows = validatedRows
                      .filter((r) => r.errors.length === 0)
                      .map((r) => r.data);
                    startImport(validRows);
                  }}
                >
                  Import {validCount} Rows
                </Button>
              )}
              {validCount === 0 && (
                <Button size="sm" disabled>
                  No valid rows
                </Button>
              )}
            </div>
          )}

          {step === 4 && !isImporting && (
            <Button
              size="sm"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

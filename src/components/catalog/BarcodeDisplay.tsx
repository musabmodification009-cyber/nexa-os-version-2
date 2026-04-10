import { useState } from "react";
import { Printer, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { escapeHtml } from "@/lib/html-escape";

// ─── Code 128B Encoder ───────────────────────────────────

const CODE128B_START = 104;
const CODE128B_STOP = [2, 3, 3, 1, 1, 1, 2]; // stop pattern

// Code128B encoding: each character maps to 6 bar/space widths
const CODE128B_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
];

// Start code B pattern
const START_B_PATTERN = [2, 1, 1, 4, 1, 2];

function encodeCode128B(text: string): number[] {
  const bars: number[] = [...START_B_PATTERN];
  let checksum = CODE128B_START;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code < 0 || code > 106) continue;
    const pattern = CODE128B_PATTERNS[code];
    if (pattern) bars.push(...pattern);
    checksum += code * (i + 1);
  }

  // Checksum character
  const checksumCode = checksum % 103;
  const checksumPattern = CODE128B_PATTERNS[checksumCode];
  if (checksumPattern) bars.push(...checksumPattern);

  // Stop
  bars.push(...CODE128B_STOP);

  return bars;
}

/** Compute rect data from bars for both JSX and string rendering. */
function computeBarRects(bars: number[], height = 50) {
  let x = 10; // quiet zone
  const rects: { x: number; w: number }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) rects.push({ x, w });
    x += w;
  }
  return { rects, totalWidth: x + 10, height };
}

/** JSX SVG barcode component — avoids dangerouslySetInnerHTML. */
function BarcodeSVG({ bars, height = 50 }: { bars: number[]; height?: number }) {
  const { rects, totalWidth, height: h } = computeBarRects(bars, height);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalWidth} ${h}`}
      width={totalWidth}
      height={h}
      className="text-foreground"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.w} height={h} fill="currentColor" />
      ))}
    </svg>
  );
}

/** String SVG for print windows (no React rendering context). */
function renderBarcodeSVGString(bars: number[], height = 50): string {
  const { rects, totalWidth, height: h } = computeBarRects(bars, height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${h}" width="${totalWidth}" height="${h}">${rects.map(r => `<rect x="${r.x}" y="0" width="${r.w}" height="${h}"/>`).join("")}</svg>`;
}

// ─── Print handler ───────────────────────────────────────

function handlePrint(itemName: string, sku: string, barcode: string, svgMarkup: string, location?: string) {
  const printWindow = window.open("", "_blank", "width=400,height=300");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head><title>Label — ${escapeHtml(sku)}</title>
    <style>
      @page { size: 2.5in 1in; margin: 0; }
      body { font-family: ui-monospace, monospace; text-align: center; padding: 8px; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 1in; box-sizing: border-box; }
      .name { font-size: 10px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 2.3in; }
      .sku { font-size: 8px; color: #555; margin-top: 2px; }
      .barcode { margin: 4px 0; }
      .barcode svg { height: 30px; width: auto; }
      .value { font-size: 9px; letter-spacing: 2px; font-weight: 600; }
      .location { font-size: 7px; color: #777; }
    </style></head><body>
      <div class="name">${escapeHtml(itemName)}</div>
      <div class="sku">SKU: ${escapeHtml(sku)}</div>
      <div class="barcode">${svgMarkup}</div>
      <div class="value">${escapeHtml(barcode)}</div>
      ${location ? `<div class="location">${escapeHtml(location)}</div>` : ""}
    </body></html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// ─── Props ───────────────────────────────────────────────

interface BarcodeDisplayProps {
  barcode: string | null;
  itemName: string;
  sku: string;
  location?: string;
  onBarcodeChange?: (value: string) => void;
}

// ─── Component ───────────────────────────────────────────

export function BarcodeDisplay({ barcode, itemName, sku, location, onBarcodeChange }: BarcodeDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = () => {
    setEditValue(barcode ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && onBarcodeChange) {
      onBarcodeChange(trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  if (!barcode) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">No barcode assigned</p>
        {onBarcodeChange && (
          editing ? (
            <div className="mt-3 flex items-center gap-2 justify-center">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter barcode value"
                className="h-8 w-48 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-2" onClick={startEdit}>
              Add Barcode
            </Button>
          )
        )}
      </div>
    );
  }

  const bars = encodeCode128B(barcode);
  const svgMarkup = renderBarcodeSVGString(bars);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground flex-1">Barcode</p>
        {onBarcodeChange && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEdit} aria-label="Edit barcode">
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 justify-center mb-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 w-48 text-sm font-mono"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          {/* SVG barcode */}
          <div
            className="mx-auto flex justify-center"
            style={{ maxWidth: 240, height: 56 }}
            aria-label={`Barcode: ${barcode}`}
          >
            <BarcodeSVG bars={bars} />
          </div>

          {/* Barcode number */}
          <p className="mt-2 text-center font-mono text-lg font-semibold tracking-widest">{barcode}</p>
        </>
      )}

      {/* Print button */}
      <div className="mt-3 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => handlePrint(itemName, sku, barcode, svgMarkup, location)}
        >
          <Printer className="h-3.5 w-3.5" />
          Print Label
        </Button>
      </div>
    </div>
  );
}

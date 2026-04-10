import type { Item } from "@/types/inventory";
import { escapeHtml } from "@/lib/html-escape";

// ─── Code 128B Encoder (shared with BarcodeDisplay) ──────

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

const START_B_PATTERN = [2, 1, 1, 4, 1, 2];
const STOP_PATTERN = [2, 3, 3, 1, 1, 1, 2];

function encodeCode128B(text: string): number[] {
  const bars: number[] = [...START_B_PATTERN];
  let checksum = 104;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code < 0 || code > 106) continue;
    const pattern = CODE128B_PATTERNS[code];
    if (pattern) bars.push(...pattern);
    checksum += code * (i + 1);
  }
  const checksumPattern = CODE128B_PATTERNS[checksum % 103];
  if (checksumPattern) bars.push(...checksumPattern);
  bars.push(...STOP_PATTERN);
  return bars;
}

function barcodeSVG(text: string, height = 30): string {
  const bars = encodeCode128B(text);
  let x = 5;
  const rects: string[] = [];
  for (let i = 0; i < bars.length; i++) {
    const w = bars[i];
    if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}"/>`);
    x += w;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 5} ${height}" width="${x + 5}" height="${height}">${rects.join("")}</svg>`;
}

// ─── Print function ──────────────────────────────────────

function buildLabelHTML(items: Item[], locationNames: Map<string, string>): string {
  const labels = items.map((item) => {
    const bc = item.barcode || item.sku;
    const loc = item.locationId ? locationNames.get(item.locationId) ?? "" : "";
    return `
      <div class="label">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="sku">SKU: ${escapeHtml(item.sku)}</div>
        <div class="barcode">${barcodeSVG(bc)}</div>
        <div class="value">${escapeHtml(bc)}</div>
        ${loc ? `<div class="loc">${escapeHtml(loc)}</div>` : ""}
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html><head><title>Barcode Labels</title>
<style>
  @page { size: 2.5in 1in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ui-monospace, SFMono-Regular, monospace; }
  .label {
    width: 2.5in; height: 1in;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 4px 8px;
    page-break-after: always;
  }
  .label:last-child { page-break-after: auto; }
  .name { font-size: 10px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 2.3in; }
  .sku { font-size: 8px; color: #555; margin-top: 1px; }
  .barcode { margin: 3px 0; }
  .barcode svg { height: 28px; width: auto; }
  .value { font-size: 9px; letter-spacing: 2px; font-weight: 600; }
  .loc { font-size: 7px; color: #777; }
</style></head><body>${labels}</body></html>`;
}

export function printBarcodeLabels(items: Item[], locationNames: Map<string, string>) {
  const html = buildLabelHTML(items, locationNames);
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

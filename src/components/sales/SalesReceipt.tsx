import { useState } from "react";
import { format } from "date-fns";
import { Printer, X, Download, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { SaleTransaction } from "@/types/inventory";
import { useDemo } from "@/hooks/useDemo";

const NAIRA = "₦";

function fmtNgn(amount: number): string {
  return `${NAIRA}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function getStoreName(businessType: string | null): string {
  const names: Record<string, string> = {
    retail: "My Retail Store",
    restaurant: "My Restaurant",
    wholesale: "My Wholesale Store",
    general: "My Store",
  };
  return businessType ? names[businessType] ?? "My Store" : "My Store";
}

function buildReceiptText(sale: SaleTransaction, storeName: string): string {
  const lines: string[] = [];
  lines.push(`🧾 *${storeName}*`);
  lines.push(`Receipt #${sale.id.slice(-8).toUpperCase()}`);
  lines.push(`Date: ${format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}`);
  if (sale.customerName) lines.push(`Customer: ${sale.customerName}`);
  lines.push("");
  lines.push("─────────────────");
  sale.items.forEach((li) => {
    lines.push(`${li.itemName}`);
    lines.push(`  ${li.quantity} × ${fmtNgn(li.unitPriceNgn)} = ${fmtNgn(li.unitPriceNgn * li.quantity)}`);
  });
  lines.push("─────────────────");
  lines.push(`*TOTAL: ${fmtNgn(sale.totalNgn)}*`);
  lines.push("");
  lines.push("Thank you for your purchase! 🙏");
  return lines.join("\n");
}

async function generateReceiptPDF(sale: SaleTransaction, storeName: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: [80, 200] }); // receipt width

  const w = 80;
  let y = 10;
  const lm = 6; // left margin
  const rm = w - 6; // right margin

  // Store name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(storeName, w / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Receipt of Purchase", w / 2, y, { align: "center" });
  y += 6;

  // Line
  doc.setDrawColor(200);
  doc.line(lm, y, rm, y);
  y += 5;

  // Receipt info
  doc.setFontSize(8);
  doc.text("Receipt #", lm, y);
  doc.setFont("helvetica", "bold");
  doc.text(sale.id.slice(-8).toUpperCase(), rm, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Date", lm, y);
  doc.text(format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm"), rm, y, { align: "right" });
  y += 4;

  if (sale.customerName) {
    doc.text("Customer", lm, y);
    doc.text(sale.customerName, rm, y, { align: "right" });
    y += 4;
  }
  if (sale.customerPhone) {
    doc.text("Phone", lm, y);
    doc.text(sale.customerPhone, rm, y, { align: "right" });
    y += 4;
  }

  y += 2;
  doc.line(lm, y, rm, y);
  y += 5;

  // Line items
  doc.setFontSize(8);
  sale.items.forEach((li) => {
    doc.setFont("helvetica", "bold");
    const name = li.itemName.length > 28 ? li.itemName.slice(0, 26) + "…" : li.itemName;
    doc.text(name, lm, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");
    doc.text(`${li.quantity} x ${fmtNgn(li.unitPriceNgn)}`, lm + 2, y);
    doc.text(fmtNgn(li.unitPriceNgn * li.quantity), rm, y, { align: "right" });
    y += 5;
  });

  // Total
  doc.line(lm, y, rm, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", lm, y);
  doc.text(fmtNgn(sale.totalNgn), rm, y, { align: "right" });
  y += 8;

  // Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your purchase!", w / 2, y, { align: "center" });
  y += 3;
  doc.text(`Powered by ${storeName}`, w / 2, y, { align: "center" });

  return doc.output("blob");
}

interface SalesReceiptProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export function SalesReceipt({ sale, onClose }: SalesReceiptProps) {
  const { onboarding } = useDemo();
  const storeName = getStoreName(onboarding.businessType);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await generateReceiptPDF(sale, storeName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${sale.id.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppText = () => {
    const text = buildReceiptText(sale, storeName);
    const phone = sale.customerPhone?.replace(/\D/g, "") ?? "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleWhatsAppPDF = async () => {
    // Generate PDF and share text with note about the PDF
    const text = buildReceiptText(sale, storeName);
    const phone = sale.customerPhone?.replace(/\D/g, "") ?? "";

    // Download PDF first
    try {
      const blob = await generateReceiptPDF(sale, storeName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${sale.id.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF download failed, continue with text
    }

    // Open WhatsApp with text
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text + "\n\n📎 PDF receipt attached separately")}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-[400px] rounded-2xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header actions */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-4 pt-4 pb-2 print:hidden rounded-t-2xl">
          <h3 className="text-sm font-semibold text-foreground">Receipt</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="receipt-print-area px-6 pb-3">
          {/* Store header */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{storeName}</h2>
            <p className="text-xs text-muted-foreground">Receipt of Purchase</p>
          </div>

          <Separator className="my-3" />

          {/* Receipt info */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Receipt #</span>
            <span className="font-mono font-medium text-foreground">{sale.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Date</span>
            <span className="font-medium text-foreground">{format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}</span>
          </div>

          {sale.customerName && (
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Customer</span>
              <span className="font-medium text-foreground">{sale.customerName}</span>
            </div>
          )}
          {sale.customerPhone && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Phone</span>
              <span className="font-mono text-foreground">{sale.customerPhone}</span>
            </div>
          )}

          <Separator className="my-3" />

          {/* Line items */}
          <div className="space-y-2">
            {sale.items.map((li, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{li.itemName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {li.quantity} × {fmtNgn(li.unitPriceNgn)}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground shrink-0">
                  {fmtNgn(li.unitPriceNgn * li.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="font-mono text-xl font-bold text-foreground">{fmtNgn(sale.totalNgn)}</span>
          </div>

          {/* Footer */}
          <div className="mt-3 text-center">
            <p className="text-[10px] text-muted-foreground">Thank you for your purchase!</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-border px-4 py-3 space-y-2 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> {downloading ? "…" : "PDF"}
            </Button>
          </div>

          {sale.customerPhone && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground text-center">Share via WhatsApp</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppText}
                  className="gap-1.5 border-green-600/30 text-green-600 hover:bg-green-600/10 hover:text-green-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppPDF}
                  className="gap-1.5 border-green-600/30 text-green-600 hover:bg-green-600/10 hover:text-green-600"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF + Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

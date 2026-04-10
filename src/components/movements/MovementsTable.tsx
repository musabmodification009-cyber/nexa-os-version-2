import { useState, useMemo, Fragment } from "react";
import {
  PackageCheck,
  PackageMinus,
  PenLine,
  ArrowLeftRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { MovementType } from "@/types/inventory";
import type { StockMovement } from "@/types/inventory";
import { formatDistanceToNow, format } from "date-fns";

const TYPE_META: Record<MovementType, { icon: typeof PackageCheck; label: string }> = {
  [MovementType.Received]: { icon: PackageCheck, label: "Received" },
  [MovementType.Shipped]: { icon: PackageMinus, label: "Shipped" },
  [MovementType.Adjusted]: { icon: PenLine, label: "Adjusted" },
  [MovementType.Transferred]: { icon: ArrowLeftRight, label: "Transferred" },
};

function directionOf(type: MovementType, qty: number): "in" | "out" {
  if (type === MovementType.Received) return "in";
  if (type === MovementType.Shipped) return "out";
  return qty >= 0 ? "in" : "out";
}

interface MovementsTableProps {
  movements: StockMovement[];
  itemNameMap: Map<string, string>;
  locationNameMap?: Map<string, string>;
}

const PER_PAGE = 25;

export function MovementsTable({ movements, itemNameMap, locationNameMap }: MovementsTableProps) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const sorted = useMemo(
    () => [...movements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [movements],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const start = safePage * PER_PAGE + 1;
  const end = Math.min((safePage + 1) * PER_PAGE, sorted.length);

  if (sorted.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No stock movements recorded</p>;
  }

  const pagination = (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>Showing {start}–{end} of {sorted.length} movements</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Next</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div>
        <div className="space-y-3">
          {paged.map((m) => {
            const meta = TYPE_META[m.type];
            const Icon = meta.icon;
            const dir = directionOf(m.type, m.quantity);
            const absQty = Math.abs(m.quantity);
            return (
              <Card key={m.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {meta.label}
                    </CardTitle>
                    <span className={`font-mono text-sm font-medium ${dir === "in" ? "text-emerald-600" : "text-red-500"}`}>
                      {dir === "in" ? "+" : "−"}{absQty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item</span>
                    <span className="truncate ml-2 font-medium">{itemNameMap.get(m.itemId) ?? "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">By</span>
                    <span>{m.performedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</span>
                  </div>
                  {expandedId === m.id && (
                    <div className="pt-2 border-t border-border mt-2 space-y-1">
                      {m.reference && <div><span className="text-muted-foreground">Ref:</span> {m.reference}</div>}
                      {m.notes && <div><span className="text-muted-foreground">Note:</span> {m.notes}</div>}
                      <a href={`/app/catalog?item=${m.itemId}`} className="inline-flex items-center gap-1 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3" /> View Item
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {pagination}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-[36px]" />
                <TableHead className="w-[140px]">Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[80px]">Direction</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[140px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((m) => {
                const meta = TYPE_META[m.type];
                const Icon = meta.icon;
                const dir = directionOf(m.type, m.quantity);
                const absQty = Math.abs(m.quantity);
                const isExpanded = expandedId === m.id;

                return (
                  <Fragment key={m.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                      <TableCell className="w-[36px] px-2">
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm"><Icon className="h-4 w-4 text-muted-foreground" />{meta.label}</span>
                      </TableCell>
                      <TableCell className="font-medium">{itemNameMap.get(m.itemId) ?? <span className="italic text-muted-foreground/60 line-through">[Item Deleted]</span>}</TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm font-medium ${dir === "in" ? "text-emerald-600" : "text-red-500"}`}>{dir === "in" ? "+" : "−"}{absQty}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${dir === "in" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>{dir}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.performedBy}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{m.reference || "—"}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default text-sm text-muted-foreground">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</span>
                          </TooltipTrigger>
                          <TooltipContent>{format(new Date(m.createdAt), "PPpp")}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${m.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={8} className="px-6 py-4">
                          <MovementDetail
                            movement={m}
                            itemName={itemNameMap.get(m.itemId) ?? m.itemId}
                            fromLocation={m.fromLocationId && locationNameMap ? locationNameMap.get(m.fromLocationId) : undefined}
                            toLocation={m.toLocationId && locationNameMap ? locationNameMap.get(m.toLocationId) : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {pagination}
      </div>
    </TooltipProvider>
  );
}

interface MovementDetailProps {
  movement: StockMovement;
  itemName: string;
  fromLocation?: string;
  toLocation?: string;
}

function MovementDetail({ movement, itemName, fromLocation, toLocation }: MovementDetailProps) {
  const isTransfer = movement.type === MovementType.Transferred;
  return (
    <div className="space-y-2 text-sm">
      {(movement.notes || movement.reference) && (
        <div><span className="font-medium text-foreground">Note: </span><span className="text-muted-foreground">{movement.notes || movement.reference}</span></div>
      )}
      {isTransfer && (fromLocation || toLocation) && (
        <div><span className="font-medium text-foreground">Transfer: </span><span className="text-muted-foreground">{fromLocation ?? "—"} → {toLocation ?? "—"}</span></div>
      )}
      <div>
        <a href={`/app/catalog?item=${movement.itemId}`} className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="h-3 w-3" />View {itemName}
        </a>
      </div>
    </div>
  );
}

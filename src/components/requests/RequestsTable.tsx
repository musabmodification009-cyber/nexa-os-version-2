import { useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatus } from "@/types/inventory";
import type { InventoryRequest } from "@/types/inventory";

const STATUS_LABEL: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: "Pending",
  [RequestStatus.Approved]: "Approved",
  [RequestStatus.PartiallyFulfilled]: "Partial",
  [RequestStatus.Fulfilled]: "Fulfilled",
  [RequestStatus.Declined]: "Declined",
  [RequestStatus.Cancelled]: "Cancelled",
};

const STATUS_CLASS: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: "bg-primary/15 text-primary border-primary/20",
  [RequestStatus.Approved]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [RequestStatus.PartiallyFulfilled]: "bg-amber-accent/15 text-amber-accent border-amber-accent/20",
  [RequestStatus.Fulfilled]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [RequestStatus.Declined]: "bg-destructive/15 text-destructive border-destructive/20",
  [RequestStatus.Cancelled]: "bg-muted text-muted-foreground",
};

interface RequestsTableProps {
  requests: InventoryRequest[];
  onRowClick: (request: InventoryRequest) => void;
  showRequestor?: boolean;
  preSorted?: boolean;
}

export function RequestsTable({ requests, onRowClick, showRequestor = false, preSorted = false }: RequestsTableProps) {
  const sorted = useMemo(
    () => preSorted ? requests : [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests, preSorted],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">No requests submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>Title</TableHead>
            {showRequestor && <TableHead>Requestor</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((req) => (
            <TableRow
              key={req.id}
              className="cursor-pointer"
              onClick={() => onRowClick(req)}
            >
              <TableCell className="font-mono text-xs">{req.requestNumber}</TableCell>
              <TableCell className="font-medium">{req.title}</TableCell>
              {showRequestor && (
                <TableCell className="text-sm">{req.requestedBy}</TableCell>
              )}
              <TableCell>
                <Badge variant="outline" className={STATUS_CLASS[req.status]}>
                  {STATUS_LABEL[req.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {req.items.length}
              </TableCell>
              <TableCell>
                {req.priority === "urgent" ? (
                  <Badge variant="outline" className="bg-amber-accent/15 text-amber-accent border-amber-accent/20">
                    Urgent
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Normal</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(req.createdAt), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

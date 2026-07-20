"use client";

import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { FormTypeBadge } from "@/components/form-type-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RowActionsMenu } from "@/components/table/row-actions-menu";
import { formatDate, formatEUR, formatPartySize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingRequest } from "@/lib/types";
import type { ConflictGroup, ConflictSeverity } from "@/lib/conflicts";
import { SEVERITY_RANK } from "@/lib/conflicts";
import type { QuickbooksRefs } from "@/lib/use-table-requests";
import {
  COLUMN_LABELS,
  SORT_COLUMN_LABELS,
  type SortColumnId,
  type TableColumnId,
  type TableSort,
} from "@/lib/table-query";

interface RequestTableProps {
  rows: BookingRequest[];
  visibleColumns: TableColumnId[];
  sort: TableSort;
  onSortChange: (column: SortColumnId, appendSecondary: boolean) => void;
  conflictsByRequestId: Map<string, ConflictGroup[]>;
  quickbooksByRequestId: Map<string, QuickbooksRefs>;
  density: "comfortable" | "compact";
  onRowClick: (id: string) => void;
}

const SEVERITY_RING: Record<ConflictSeverity, string> = {
  double_booked: "ring-1 ring-inset ring-destructive/50",
  hard: "ring-1 ring-inset ring-destructive/30",
  soft: "ring-1 ring-inset ring-amber-400/40",
};

function worstSeverity(conflicts: ConflictGroup[]): ConflictSeverity | null {
  if (conflicts.length === 0) return null;
  return conflicts.reduce<ConflictSeverity>(
    (acc, c) => (SEVERITY_RANK[c.severity] < SEVERITY_RANK[acc] ? c.severity : acc),
    conflicts[0].severity
  );
}

function SortHeader({
  id,
  sort,
  onSortChange,
}: {
  id: SortColumnId;
  sort: TableSort;
  onSortChange: (column: SortColumnId, appendSecondary: boolean) => void;
}) {
  const isPrimary = sort.column === id;
  const isSecondary = sort.column2 === id;
  const direction = isPrimary
    ? sort.direction
    : isSecondary
      ? sort.direction2
      : undefined;

  const Icon = !direction ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={(e) => onSortChange(id, e.shiftKey)}
      className={cn(
        "group inline-flex items-center gap-1 rounded px-0.5 -mx-0.5 transition-colors hover:text-foreground",
        (isPrimary || isSecondary) && "text-foreground"
      )}
      title="Click to sort, shift-click to add a secondary sort"
    >
      {SORT_COLUMN_LABELS[id]}
      <Icon
        className={cn(
          "size-3",
          !direction && "opacity-0 group-hover:opacity-50"
        )}
      />
      {isSecondary && (
        <span className="text-[10px] font-semibold text-muted-foreground">2</span>
      )}
    </button>
  );
}

export function RequestTable({
  rows,
  visibleColumns,
  sort,
  onSortChange,
  conflictsByRequestId,
  quickbooksByRequestId,
  density,
  onRowClick,
}: RequestTableProps) {
  const cellPad = density === "compact" ? "py-1" : "py-2";

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" aria-label="Conflict" />
            <TableHead>
              <SortHeader id="status" sort={sort} onSortChange={onSortChange} />
            </TableHead>
            {visibleColumns.includes("guest") && (
              <TableHead>
                <SortHeader id="guest" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("activity") && (
              <TableHead>
                <SortHeader id="activity" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("date") && (
              <TableHead>
                <SortHeader id="date" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("party") && (
              <TableHead>
                <SortHeader id="party" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("amount") && (
              <TableHead>
                <SortHeader id="amount" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("email") && (
              <TableHead>
                <SortHeader id="email" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("phone") && (
              <TableHead>{COLUMN_LABELS.phone}</TableHead>
            )}
            {visibleColumns.includes("submitted") && (
              <TableHead>
                <SortHeader id="submitted" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("reference") && (
              <TableHead>
                <SortHeader id="reference" sort={sort} onSortChange={onSortChange} />
              </TableHead>
            )}
            {visibleColumns.includes("message") && (
              <TableHead>{COLUMN_LABELS.message}</TableHead>
            )}
            {visibleColumns.includes("quickbooks") && (
              <TableHead>{COLUMN_LABELS.quickbooks}</TableHead>
            )}
            <TableHead className="w-8" aria-label="Actions" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const conflicts = conflictsByRequestId.get(r.id) ?? [];
            const severity = worstSeverity(conflicts);
            const qb = quickbooksByRequestId.get(r.id);

            return (
              <TableRow
                key={r.id}
                onClick={() => onRowClick(r.id)}
                className={cn(
                  "cursor-pointer",
                  severity && SEVERITY_RING[severity]
                )}
              >
                <TableCell className={cellPad}>
                  {severity && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="flex size-6 items-center justify-center" />
                        }
                      >
                        <AlertTriangle
                          className={cn(
                            "size-4",
                            severity === "soft"
                              ? "text-amber-500"
                              : "text-destructive"
                          )}
                          strokeWidth={2.5}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {conflicts.length} overlapping request
                        {conflicts.length === 1 ? "" : "s"} on{" "}
                        {conflicts[0]?.activityName}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className={cellPad}>
                  <StatusBadge status={r.status} />
                </TableCell>
                {visibleColumns.includes("guest") && (
                  <TableCell className={cn(cellPad, "max-w-40 truncate font-medium text-foreground")} title={r.fullName}>
                    {r.fullName}
                  </TableCell>
                )}
                {visibleColumns.includes("activity") && (
                  <TableCell className={cn(cellPad, "max-w-56")}>
                    <div className="flex items-center gap-1.5">
                      <FormTypeBadge formType={r.formType} />
                      <span className="truncate" title={r.activityName}>
                        {r.activityName}
                      </span>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes("date") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap tabular-nums")}>
                    {formatDate(r.startDate)}
                    {r.endDate && r.endDate !== r.startDate && (
                      <> – {formatDate(r.endDate)}</>
                    )}
                  </TableCell>
                )}
                {visibleColumns.includes("party") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap")}>
                    {formatPartySize(r.adults, r.children)}
                  </TableCell>
                )}
                {visibleColumns.includes("amount") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap tabular-nums")}>
                    <span className="font-medium text-foreground">
                      {formatEUR(r.totalAmount)}
                    </span>
                    {r.paid && (
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        Paid
                      </span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.includes("email") && (
                  <TableCell className={cn(cellPad, "max-w-48 truncate")} title={r.email}>
                    {r.email}
                  </TableCell>
                )}
                {visibleColumns.includes("phone") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap")}>
                    {r.phone}
                  </TableCell>
                )}
                {visibleColumns.includes("submitted") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap tabular-nums text-muted-foreground")}>
                    {formatDate(r.createdAt)}
                  </TableCell>
                )}
                {visibleColumns.includes("reference") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap font-mono text-xs")}>
                    {r.reference || "—"}
                  </TableCell>
                )}
                {visibleColumns.includes("message") && (
                  <TableCell className={cn(cellPad, "max-w-56 truncate text-muted-foreground")} title={r.message}>
                    {r.message || "—"}
                  </TableCell>
                )}
                {visibleColumns.includes("quickbooks") && (
                  <TableCell className={cn(cellPad, "whitespace-nowrap text-xs text-muted-foreground")}>
                    {qb?.quickbooksInvoiceId ? `Inv #${qb.quickbooksInvoiceId}` : "—"}
                  </TableCell>
                )}
                <TableCell
                  className={cellPad}
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu request={r} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

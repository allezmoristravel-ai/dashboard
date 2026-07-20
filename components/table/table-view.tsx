"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AlignJustify, ChevronLeft, ChevronRight, Rows3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/request-card";
import { TableFilterBar } from "@/components/table/table-filter-bar";
import { ColumnPicker } from "@/components/table/column-picker";
import { RequestTable } from "@/components/table/request-table";
import { useRequests } from "@/lib/store";
import { useTableRequests } from "@/lib/use-table-requests";
import { detectConflicts, type ConflictGroup, type ConflictableRequest } from "@/lib/conflicts";
import {
  PAGE_SIZE,
  parseTableSearchParams,
  resolveVisibleColumns,
  tableStateToSearchParams,
  type SortColumnId,
  type TableColumnId,
  type TableFilters,
} from "@/lib/table-query";

const COLUMNS_STORAGE_KEY = "table-visible-columns";
const DENSITY_STORAGE_KEY = "table-density";

function readStoredColumns(): TableColumnId[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TableColumnId[]) : null;
  } catch {
    return null;
  }
}

function readStoredDensity(): "comfortable" | "compact" {
  if (typeof window === "undefined") return "comfortable";
  return window.localStorage.getItem(DENSITY_STORAGE_KEY) === "compact"
    ? "compact"
    : "comfortable";
}

export function TableView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlState = useMemo(
    () => parseTableSearchParams(searchParams),
    [searchParams]
  );

  // Lazy initializers, not an effect: this component is mounted client-only
  // (app/table/page.tsx loads it via next/dynamic with ssr:false, same as
  // the calendar), so reading localStorage/window here on first render is
  // safe and avoids an extra render pass to hydrate it.
  const [storedColumns, setStoredColumns] = useState<TableColumnId[] | null>(
    () => readStoredColumns()
  );
  const [density, setDensity] = useState<"comfortable" | "compact">(() =>
    readStoredDensity()
  );

  const visibleColumns = resolveVisibleColumns(urlState.columns, storedColumns);

  const updateUrl = useCallback(
    (partial: {
      filters?: Partial<TableFilters>;
      sort?: typeof urlState.sort;
      page?: number;
      columns?: TableColumnId[];
    }) => {
      const next = {
        filters: partial.filters
          ? { ...urlState.filters, ...partial.filters }
          : urlState.filters,
        sort: partial.sort ?? urlState.sort,
        page: partial.page ?? urlState.page,
        columns: partial.columns ?? urlState.columns,
      };
      // Any filter/sort change resets pagination — a stale page index on a
      // narrower result set would silently show an empty page.
      if (partial.filters || partial.sort) next.page = 0;
      const params = tableStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [urlState, router, pathname]
  );

  const handleFilterChange = useCallback(
    (partial: Partial<TableFilters>) => updateUrl({ filters: partial }),
    [updateUrl]
  );

  const handleSortChange = useCallback(
    (column: SortColumnId, appendSecondary: boolean) => {
      if (appendSecondary) {
        if (column === urlState.sort.column) return;
        const direction2 =
          urlState.sort.column2 === column && urlState.sort.direction2 === "asc"
            ? "desc"
            : "asc";
        updateUrl({ sort: { ...urlState.sort, column2: column, direction2 } });
        return;
      }
      const direction =
        urlState.sort.column === column && urlState.sort.direction === "asc"
          ? "desc"
          : "asc";
      updateUrl({ sort: { column, direction } });
    },
    [urlState.sort, updateUrl]
  );

  const handleColumnsChange = useCallback(
    (next: TableColumnId[]) => {
      setStoredColumns(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      }
      updateUrl({ columns: next });
    },
    [updateUrl]
  );

  const handleDensityChange = useCallback((next: "comfortable" | "compact") => {
    setDensity(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, next);
    }
  }, []);

  // Full unpaginated request list already loaded app-wide (inbox/calendar) —
  // reused here for the activity filter's option list and for conflict
  // detection, which must see every active-status request regardless of the
  // table's current filters/pagination (a conflict spanning two pages must
  // still be found). This mirrors how the calendar reuses the same store.
  const { requests: allRequests } = useRequests();

  const activities = useMemo(
    () => Array.from(new Set(allRequests.map((r) => r.activityName))).sort(),
    [allRequests]
  );

  const conflictGroups = useMemo<ConflictGroup[]>(() => {
    const inputs: ConflictableRequest[] = allRequests.map((r) => ({
      id: r.id,
      activityRef: r.activityRef,
      activityName: r.activityName,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    }));
    return detectConflicts(inputs);
  }, [allRequests]);

  const conflictsByRequestId = useMemo(() => {
    const map = new Map<string, ConflictGroup[]>();
    for (const group of conflictGroups) {
      for (const id of group.requestIds) {
        const existing = map.get(id);
        if (existing) existing.push(group);
        else map.set(id, [group]);
      }
    }
    return map;
  }, [conflictGroups]);

  const conflictRequestIds = useMemo(() => {
    if (!urlState.filters.conflictsOnly) return null;
    return new Set(conflictsByRequestId.keys());
  }, [urlState.filters.conflictsOnly, conflictsByRequestId]);

  const needsQuickbooks = visibleColumns.includes("quickbooks");

  const { rows, totalCount, loading, error, quickbooksByRequestId, refetch } =
    useTableRequests({
      filters: urlState.filters,
      sort: urlState.sort,
      page: urlState.page,
      conflictRequestIds,
      needsQuickbooks,
    });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TableFilterBar
          activities={activities}
          filters={urlState.filters}
          onChange={handleFilterChange}
          conflictCount={conflictsByRequestId.size}
        />
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={density === "comfortable" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Comfortable row height"
              aria-pressed={density === "comfortable"}
              onClick={() => handleDensityChange("comfortable")}
            >
              <Rows3 />
            </Button>
            <Button
              variant={density === "compact" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Compact row height"
              aria-pressed={density === "compact"}
              onClick={() => handleDensityChange("compact")}
            >
              <AlignJustify />
            </Button>
          </div>
          <ColumnPicker
            visibleColumns={visibleColumns}
            onChange={handleColumnsChange}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load bookings
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-24 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Table2 className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              No bookings match these filters
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Try widening the status, date range, or search filters.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* Desktop / tablet: dense table */}
          <div className="hidden sm:block">
            <RequestTable
              rows={rows}
              visibleColumns={visibleColumns}
              sort={urlState.sort}
              onSortChange={handleSortChange}
              conflictsByRequestId={conflictsByRequestId}
              quickbooksByRequestId={quickbooksByRequestId}
              density={density}
              onRowClick={(id) => router.push(`/requests/${id}`)}
            />
          </div>

          {/* Mobile: stacked cards, same component the inbox uses */}
          <div className="grid gap-4 sm:hidden">
            {rows.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {urlState.page * PAGE_SIZE + 1}–
              {Math.min(totalCount, (urlState.page + 1) * PAGE_SIZE)} of{" "}
              {totalCount}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={urlState.page <= 0}
                onClick={() => updateUrl({ page: urlState.page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">
                {urlState.page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={urlState.page + 1 >= totalPages}
                onClick={() => updateUrl({ page: urlState.page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

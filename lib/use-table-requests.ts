"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BookingRequest, DbBookingRequest } from "./types";
import { mapDbRow } from "./types";
import { getSupabase } from "./supabase";
import {
  PAGE_SIZE,
  SORTABLE_FIELDS,
  type TableFilters,
  type TableSort,
} from "./table-query";

export interface QuickbooksRefs {
  quickbooksInvoiceId: string | null;
  quickbooksPaymentId: string | null;
}

const EMPTY_QUICKBOOKS_MAP = new Map<string, QuickbooksRefs>();

interface UseTableRequestsArgs {
  filters: TableFilters;
  sort: TableSort;
  page: number;
  // Pass a *memoized* Set (stable reference unless conflicts actually
  // change) — it's a hook dependency. null means "conflicts-only is off".
  conflictRequestIds: Set<string> | null;
  needsQuickbooks: boolean;
}

interface UseTableRequestsResult {
  rows: BookingRequest[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  quickbooksByRequestId: Map<string, QuickbooksRefs>;
  refetch: () => void;
}

// Table-specific read path: paginated, filtered, sorted server-side. This is
// deliberately separate from useRequests() in lib/store.tsx, which loads the
// *entire* unpaginated request list for the inbox/calendar — the table needs
// a different query shape (range/order/filters), so it opens its own
// PostgREST query and its own Realtime channel via the same getSupabase()
// singleton client. Row actions (approve/decline/cancel/complete) still go
// through useRequests() — this hook is read-only.
export function useTableRequests({
  filters,
  sort,
  page,
  conflictRequestIds,
  needsQuickbooks,
}: UseTableRequestsArgs): UseTableRequestsResult {
  const [rows, setRows] = useState<BookingRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickbooksByRequestId, setQuickbooksByRequestId] = useState<
    Map<string, QuickbooksRefs>
  >(new Map());
  const [refetchToken, setRefetchToken] = useState(0);

  const rowsRef = useRef<BookingRequest[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const conflictsOnly = filters.conflictsOnly;
  const statusesKey = filters.statuses.join(",");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      if (conflictsOnly && conflictRequestIds && conflictRequestIds.size === 0) {
        // Nothing conflicts right now — short-circuit instead of issuing an
        // .in("id", []) query (which some PostgREST setups treat oddly).
        setRows([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let query = getSupabase().from("requests").select("*", { count: "exact" });

      if (filters.statuses.length > 0) query = query.in("status", filters.statuses);
      if (filters.activity) query = query.eq("activity_name", filters.activity);
      if (filters.dateFrom) query = query.gte("start_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("start_date", filters.dateTo);
      if (filters.search.trim()) {
        // Strip characters that would break out of the PostgREST .or() filter
        // syntax (comma separates conditions, % is the ilike wildcard).
        const term = filters.search.trim().replace(/[%,]/g, "");
        if (term) {
          query = query.or(
            `full_name.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%`
          );
        }
      }
      if (conflictsOnly && conflictRequestIds) {
        query = query.in("id", Array.from(conflictRequestIds));
      }

      const primaryField = SORTABLE_FIELDS[sort.column];
      query = query.order(primaryField, { ascending: sort.direction === "asc" });
      if (sort.column2) {
        const secondaryField = SORTABLE_FIELDS[sort.column2];
        query = query.order(secondaryField, {
          ascending: sort.direction2 !== "desc",
        });
      }

      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, error: queryError, count } = await query;
      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setRows(((data ?? []) as DbBookingRequest[]).map(mapDbRow));
      setTotalCount(count ?? 0);
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusesKey,
    filters.activity,
    filters.dateFrom,
    filters.dateTo,
    filters.search,
    conflictsOnly,
    conflictRequestIds,
    sort.column,
    sort.direction,
    sort.column2,
    sort.direction2,
    page,
    refetchToken,
  ]);

  // Realtime: patch a row already on this page in place. A change to a row
  // NOT on this page (or a delete of one that is) can move rows across page
  // boundaries under the current sort/filter, so those cases re-run the
  // query rather than guessing — still scoped to just this page, unlike a
  // full unpaginated refetch.
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("table-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "booking", table: "requests" },
        (payload: {
          eventType: "INSERT" | "UPDATE" | "DELETE";
          new: DbBookingRequest | Record<string, never>;
          old: DbBookingRequest | Record<string, never>;
        }) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as DbBookingRequest).id;
            if (rowsRef.current.some((r) => r.id === oldId)) {
              setRefetchToken((t) => t + 1);
            }
            return;
          }

          const mapped = mapDbRow(payload.new as DbBookingRequest);
          const idx = rowsRef.current.findIndex((r) => r.id === mapped.id);
          if (idx === -1) {
            setRefetchToken((t) => t + 1);
            return;
          }
          setRows((prev) => {
            const next = [...prev];
            next[idx] = mapped;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const idsKey = useMemo(() => rows.map((r) => r.id).join(","), [rows]);

  useEffect(() => {
    if (!needsQuickbooks || rows.length === 0) return;
    let cancelled = false;
    (async () => {
      const ids = rows.map((r) => r.id);
      const { data, error: qErr } = await getSupabase()
        .from("payments")
        .select("request_id, quickbooks_invoice_id, quickbooks_payment_id")
        .in("request_id", ids);
      if (cancelled) return;
      if (qErr) {
        console.error("Failed to fetch QuickBooks refs:", qErr.message);
        return;
      }
      const map = new Map<string, QuickbooksRefs>();
      for (const row of (data ?? []) as {
        request_id: string;
        quickbooks_invoice_id: string | null;
        quickbooks_payment_id: string | null;
      }[]) {
        map.set(row.request_id, {
          quickbooksInvoiceId: row.quickbooks_invoice_id,
          quickbooksPaymentId: row.quickbooks_payment_id,
        });
      }
      setQuickbooksByRequestId(map);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsQuickbooks, idsKey]);

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  return {
    rows,
    totalCount,
    loading,
    error,
    quickbooksByRequestId: needsQuickbooks
      ? quickbooksByRequestId
      : EMPTY_QUICKBOOKS_MAP,
    refetch,
  };
}

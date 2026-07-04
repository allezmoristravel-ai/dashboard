"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { BookingRequest, DbBookingRequest, DbPayment } from "./types";
import { mapDbRow } from "./types";
import { getSupabase } from "./supabase";

// --- Pure helpers (exported for testing) ---

export interface RequestState {
  requests: BookingRequest[];
}

export type RequestAction =
  | { type: "CANCEL_REQUEST"; id: string }
  | { type: "MARK_COMPLETED"; id: string };

export function validateTotalAmount(
  total: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(total) || total <= 0)
    return { valid: false, error: "Total must be a positive amount" };
  return { valid: true };
}

function updateRequestInState(
  state: RequestState,
  id: string,
  updater: (req: BookingRequest) => BookingRequest | null
): RequestState {
  const idx = state.requests.findIndex((r) => r.id === id);
  if (idx === -1) return state;
  const updated = updater(state.requests[idx]);
  if (!updated) return state;
  const requests = [...state.requests];
  requests[idx] = updated;
  return { requests };
}

export function requestReducer(
  state: RequestState,
  action: RequestAction
): RequestState {
  switch (action.type) {
    case "CANCEL_REQUEST":
      return updateRequestInState(state, action.id, (req) =>
        req.status !== "cancelled" && req.status !== "completed"
          ? { ...req, status: "cancelled" }
          : null
      );

    case "MARK_COMPLETED":
      return updateRequestInState(state, action.id, (req) =>
        req.status !== "completed" && req.status !== "cancelled"
          ? { ...req, status: "completed" }
          : null
      );

    default:
      return state;
  }
}

// --- n8n webhook (WF-2: booking review — approve/decline) ---
// The dashboard never writes booking.requests.status for these two actions;
// n8n does the Supabase writes (plus QuickBooks invoice + email) and Realtime
// reflects the result back here. This call is fire-and-forget from a data
// perspective, but a failed call leaves the request stuck in pending_review
// with no other signal, so failures must surface to the owner.
const WF2_WEBHOOK_URL = "https://n8n.srv1766517.hstgr.cloud/webhook/wf2";

interface Wf2Response {
  ok: boolean;
  error?: string;
}

async function callWf2(payload: Record<string, unknown>): Promise<void> {
  let res: Response;
  try {
    res = await fetch(WF2_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Could not reach the approval service — check your connection and try again."
    );
  }

  let body: Wf2Response | null = null;
  try {
    body = (await res.json()) as Wf2Response;
  } catch {
    // non-JSON body; fall through to the !res.ok check below
  }

  if (!res.ok || !body?.ok) {
    throw new Error(body?.error || `Request failed (HTTP ${res.status})`);
  }
}

// --- Supabase helpers ---

async function fetchAllRequests(): Promise<BookingRequest[]> {
  const { data, error } = await getSupabase()
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbBookingRequest[]).map(mapDbRow);
}

async function supabaseUpdate(
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await getSupabase()
    .from("requests")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

// --- React Context + Provider ---

interface RequestContextValue {
  requests: BookingRequest[];
  loading: boolean;
  getRequest: (id: string) => BookingRequest | undefined;
  isActionPending: (id: string) => boolean;
  sendPayment: (id: string, totalAmount: number) => Promise<void>;
  declineRequest: (id: string, note?: string) => Promise<void>;
  cancelRequest: (id: string) => void;
  markCompleted: (id: string) => void;
  fetchPaymentForRequest: (id: string) => Promise<DbPayment | null>;
  refreshRequests: () => Promise<void>;
}

const RequestContext = createContext<RequestContextValue | null>(null);

export function RequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(
    new Set()
  );

  const setActionPending = useCallback((id: string, pending: boolean) => {
    setPendingActionIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const isActionPending = useCallback(
    (id: string) => pendingActionIds.has(id),
    [pendingActionIds]
  );

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAllRequests();
      setRequests(data);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      console.error("Failed to fetch requests:", e?.message ?? e?.code ?? JSON.stringify(err));
      toast.error(`Failed to load requests: ${e?.message ?? "unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Supabase Realtime: n8n (WF-2, WF-4) and MobiPaid-driven writes happen
  // outside the dashboard, so this is how those status changes reach the UI.
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("booking-requests-changes")
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
            setRequests((prev) => prev.filter((r) => r.id !== oldId));
            return;
          }
          const mapped = mapDbRow(payload.new as DbBookingRequest);
          setRequests((prev) => {
            const idx = prev.findIndex((r) => r.id === mapped.id);
            if (idx === -1) return [mapped, ...prev];
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

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const sendPayment = useCallback(async (id: string, totalAmount: number) => {
    const validation = validateTotalAmount(totalAmount);
    if (!validation.valid) {
      toast.error(validation.error ?? "Invalid amount");
      return;
    }
    setActionPending(id, true);
    try {
      await callWf2({
        request_id: id,
        action: "send_payment",
        total_amount: totalAmount,
      });
      toast.success("Approved — payment link is being sent to the customer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(
        `Failed to approve & send payment: ${message}. The request is still pending review — try again.`,
        { duration: 10000 }
      );
    } finally {
      setActionPending(id, false);
    }
  }, [setActionPending]);

  const declineRequest = useCallback(async (id: string, note?: string) => {
    setActionPending(id, true);
    try {
      await callWf2({
        request_id: id,
        action: "decline",
        ...(note ? { note } : {}),
      });
      toast.success("Request declined");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(
        `Failed to decline request: ${message}. The request is still pending review — try again.`,
        { duration: 10000 }
      );
    } finally {
      setActionPending(id, false);
    }
  }, [setActionPending]);

  const cancelRequest = useCallback(
    async (id: string) => {
      try {
        await supabaseUpdate(id, { status: "cancelled" });
        await refresh();
        toast.success("Request cancelled");
      } catch {
        toast.error("Failed to cancel request");
      }
    },
    [refresh]
  );

  const markCompleted = useCallback(
    async (id: string) => {
      try {
        await supabaseUpdate(id, { status: "completed" });
        await refresh();
        toast.success("Request marked as completed");
      } catch {
        toast.error("Failed to mark request as completed");
      }
    },
    [refresh]
  );

  const fetchPaymentForRequest = useCallback(
    async (id: string): Promise<DbPayment | null> => {
      const { data, error } = await getSupabase()
        .from("payments")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch payment:", error.message);
        return null;
      }
      return data as DbPayment | null;
    },
    []
  );

  return (
    <RequestContext.Provider
      value={{
        requests,
        loading,
        getRequest,
        isActionPending,
        sendPayment,
        declineRequest,
        cancelRequest,
        markCompleted,
        fetchPaymentForRequest,
        refreshRequests: refresh,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequests(): RequestContextValue {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error("useRequests must be used within RequestProvider");
  return ctx;
}

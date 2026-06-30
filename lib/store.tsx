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
import type { BookingRequest, AmountUpdate, DbBookingRequest } from "./types";
import { mapDbRow } from "./types";
import { getSupabase } from "./supabase";

// --- Pure helpers (exported for testing) ---

export interface RequestState {
  requests: BookingRequest[];
}

export type RequestAction =
  | { type: "APPROVE_REQUEST"; id: string }
  | { type: "DECLINE_REQUEST"; id: string; note?: string }
  | { type: "SET_AMOUNTS"; id: string; amounts: AmountUpdate }
  | { type: "SEND_DEPOSIT_LINK"; id: string }
  | { type: "SIMULATE_DEPOSIT_PAYMENT"; id: string }
  | { type: "SEND_BALANCE_LINK"; id: string }
  | { type: "SIMULATE_BALANCE_PAYMENT"; id: string }
  | { type: "CANCEL_REQUEST"; id: string }
  | { type: "MARK_COMPLETED"; id: string };

export function validateAmounts(
  deposit: number,
  _balance: number,
  total: number
): { valid: boolean; error?: string } {
  if (total <= 0) return { valid: false, error: "Total must be positive" };
  if (deposit <= 0) return { valid: false, error: "Deposit must be positive" };
  if (deposit > total)
    return { valid: false, error: "Deposit cannot exceed total" };
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
    case "APPROVE_REQUEST":
      return updateRequestInState(state, action.id, (req) =>
        req.status === "pending_review" ? { ...req, status: "approved" } : null
      );

    case "DECLINE_REQUEST":
      return updateRequestInState(state, action.id, (req) => {
        if (req.status !== "pending_review") return null;
        const notes = action.note
          ? req.notes
            ? `${req.notes}\n\nDecline reason: ${action.note}`
            : `Decline reason: ${action.note}`
          : req.notes;
        return { ...req, status: "declined", notes };
      });

    case "SET_AMOUNTS": {
      const { deposit, balance, total } = action.amounts;
      const validation = validateAmounts(deposit, balance, total);
      if (!validation.valid) return state;
      return updateRequestInState(state, action.id, (req) =>
        req.status === "approved" || req.status === "awaiting_deposit"
          ? {
              ...req,
              depositAmount: deposit,
              balanceAmount: balance,
              totalAmount: total,
            }
          : null
      );
    }

    case "SEND_DEPOSIT_LINK":
      return updateRequestInState(state, action.id, (req) => {
        if (req.status !== "approved") return null;
        if (
          req.depositAmount === null ||
          req.balanceAmount === null ||
          req.totalAmount === null
        )
          return null;
        return { ...req, status: "awaiting_deposit" };
      });

    case "SIMULATE_DEPOSIT_PAYMENT":
      return updateRequestInState(state, action.id, (req) =>
        req.status === "awaiting_deposit"
          ? { ...req, status: "deposit_paid", depositPaid: true }
          : null
      );

    case "SEND_BALANCE_LINK":
      return updateRequestInState(state, action.id, (req) =>
        req.status === "deposit_paid"
          ? { ...req, status: "awaiting_balance" }
          : null
      );

    case "SIMULATE_BALANCE_PAYMENT":
      return updateRequestInState(state, action.id, (req) =>
        req.status === "awaiting_balance"
          ? { ...req, status: "confirmed", balancePaid: true }
          : null
      );

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
  approveRequest: (id: string) => void;
  declineRequest: (id: string, note?: string) => void;
  setAmounts: (id: string, amounts: AmountUpdate) => void;
  sendDepositLink: (id: string) => void;
  simulateDepositPayment: (id: string) => void;
  sendBalanceLink: (id: string) => void;
  simulateBalancePayment: (id: string) => void;
  cancelRequest: (id: string) => void;
  markCompleted: (id: string) => void;
  resendLink: (id: string) => void;
  refreshRequests: () => Promise<void>;
}

const RequestContext = createContext<RequestContextValue | null>(null);

export function RequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const approveRequest = useCallback(
    async (id: string) => {
      try {
        await supabaseUpdate(id, { status: "approved" });
        await refresh();
        toast.success("Request approved");
      } catch {
        toast.error("Failed to approve request");
      }
    },
    [refresh]
  );

  const declineRequest = useCallback(
    async (id: string, note?: string) => {
      try {
        const req = requests.find((r) => r.id === id);
        const notes = note
          ? req?.notes
            ? `${req.notes}\n\nDecline reason: ${note}`
            : `Decline reason: ${note}`
          : req?.notes ?? "";
        await supabaseUpdate(id, { status: "declined", notes });
        await refresh();
        toast.success("Request declined");
      } catch {
        toast.error("Failed to decline request");
      }
    },
    [requests, refresh]
  );

  const setAmounts = useCallback(
    async (id: string, amounts: AmountUpdate) => {
      const validation = validateAmounts(
        amounts.deposit,
        amounts.balance,
        amounts.total
      );
      if (!validation.valid) {
        toast.error(validation.error ?? "Invalid amounts");
        return;
      }
      try {
        await supabaseUpdate(id, {
          deposit_amount: amounts.deposit,
          balance_amount: amounts.balance,
          total_amount: amounts.total,
        });
        await refresh();
        toast.success("Amounts updated");
      } catch {
        toast.error("Failed to update amounts");
      }
    },
    [refresh]
  );

  const sendDepositLink = useCallback(
    async (id: string) => {
      const req = requests.find((r) => r.id === id);
      try {
        await supabaseUpdate(id, { status: "awaiting_deposit" });
        await refresh();
        toast.success(
          `Deposit link sent to ${req?.customerEmail ?? "customer"}`
        );
      } catch {
        toast.error("Failed to send deposit link");
      }
    },
    [requests, refresh]
  );

  const simulateDepositPayment = useCallback(
    async (id: string) => {
      try {
        await supabaseUpdate(id, {
          status: "deposit_paid",
          deposit_paid: true,
        });
        await refresh();
        toast.info("Deposit payment simulated");
      } catch {
        toast.error("Failed to simulate deposit payment");
      }
    },
    [refresh]
  );

  const sendBalanceLink = useCallback(
    async (id: string) => {
      const req = requests.find((r) => r.id === id);
      try {
        await supabaseUpdate(id, { status: "awaiting_balance" });
        await refresh();
        toast.success(
          `Balance link sent to ${req?.customerEmail ?? "customer"}`
        );
      } catch {
        toast.error("Failed to send balance link");
      }
    },
    [requests, refresh]
  );

  const simulateBalancePayment = useCallback(
    async (id: string) => {
      try {
        await supabaseUpdate(id, {
          status: "confirmed",
          balance_paid: true,
        });
        await refresh();
        toast.info("Balance payment simulated");
      } catch {
        toast.error("Failed to simulate balance payment");
      }
    },
    [refresh]
  );

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

  const resendLink = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      toast.info(`Link resent to ${req?.customerEmail ?? "customer"}`);
    },
    [requests]
  );

  return (
    <RequestContext.Provider
      value={{
        requests,
        loading,
        getRequest,
        approveRequest,
        declineRequest,
        setAmounts,
        sendDepositLink,
        simulateDepositPayment,
        sendBalanceLink,
        simulateBalancePayment,
        cancelRequest,
        markCompleted,
        resendLink,
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

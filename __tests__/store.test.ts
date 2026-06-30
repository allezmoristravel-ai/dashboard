import { describe, it, expect } from "vitest";
import { requestReducer, validateAmounts } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";

function makeRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    id: "test-001",
    reference: "REQ-TEST-001",
    activityName: "Test Activity",
    customerName: "Test Customer",
    customerEmail: "test@test.com",
    customerPhone: "+230 5000 0000",
    requestedDate: "2026-07-01",
    partySize: 2,
    notes: "",
    status: "pending_review",
    depositAmount: null,
    balanceAmount: null,
    totalAmount: null,
    depositPaid: false,
    balancePaid: false,
    createdAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("validateAmounts", () => {
  it("returns valid for deposit < total", () => {
    expect(validateAmounts(2000, 3000, 5000)).toEqual({ valid: true });
  });

  it("returns valid for deposit = total (full prepayment)", () => {
    expect(validateAmounts(5000, 0, 5000)).toEqual({ valid: true });
  });

  it("returns invalid for deposit > total", () => {
    const result = validateAmounts(6000, -1000, 5000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for zero deposit", () => {
    const result = validateAmounts(0, 5000, 5000);
    expect(result.valid).toBe(false);
  });

  it("returns invalid for negative total", () => {
    const result = validateAmounts(1000, -2000, -1000);
    expect(result.valid).toBe(false);
  });
});

describe("approveRequest", () => {
  it("transitions pending_review to approved", () => {
    const req = makeRequest({ status: "pending_review" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "APPROVE_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });

  it("does nothing if status is not pending_review", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "APPROVE_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });

  it("leaves other requests unchanged", () => {
    const req1 = makeRequest({ id: "test-001", status: "pending_review" });
    const req2 = makeRequest({ id: "test-002", status: "pending_review" });
    const state = { requests: [req1, req2] };
    const next = requestReducer(state, { type: "APPROVE_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
    expect(next.requests[1].status).toBe("pending_review");
  });
});

describe("declineRequest", () => {
  it("transitions pending_review to declined", () => {
    const req = makeRequest({ status: "pending_review" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "DECLINE_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("declined");
  });

  it("appends note to request notes", () => {
    const req = makeRequest({ status: "pending_review", notes: "Original note" });
    const state = { requests: [req] };
    const next = requestReducer(state, {
      type: "DECLINE_REQUEST",
      id: "test-001",
      note: "Fully booked",
    });
    expect(next.requests[0].notes).toContain("Fully booked");
    expect(next.requests[0].notes).toContain("Original note");
  });

  it("does nothing if status is not pending_review", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "DECLINE_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });
});

describe("setAmounts", () => {
  it("sets deposit, balance, and total on an approved request", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, {
      type: "SET_AMOUNTS",
      id: "test-001",
      amounts: { deposit: 2000, balance: 3000, total: 5000 },
    });
    expect(next.requests[0].depositAmount).toBe(2000);
    expect(next.requests[0].balanceAmount).toBe(3000);
    expect(next.requests[0].totalAmount).toBe(5000);
  });

  it("rejects deposit greater than total (state unchanged)", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, {
      type: "SET_AMOUNTS",
      id: "test-001",
      amounts: { deposit: 6000, balance: -1000, total: 5000 },
    });
    expect(next.requests[0].depositAmount).toBeNull();
  });

  it("rejects zero or negative amounts", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, {
      type: "SET_AMOUNTS",
      id: "test-001",
      amounts: { deposit: 0, balance: 5000, total: 5000 },
    });
    expect(next.requests[0].depositAmount).toBeNull();
  });

  it("allows re-setting amounts on awaiting_deposit status", () => {
    const req = makeRequest({
      status: "awaiting_deposit",
      depositAmount: 2000,
      balanceAmount: 3000,
      totalAmount: 5000,
    });
    const state = { requests: [req] };
    const next = requestReducer(state, {
      type: "SET_AMOUNTS",
      id: "test-001",
      amounts: { deposit: 3000, balance: 4000, total: 7000 },
    });
    expect(next.requests[0].depositAmount).toBe(3000);
    expect(next.requests[0].totalAmount).toBe(7000);
  });
});

describe("sendDepositLink", () => {
  it("transitions approved to awaiting_deposit when amounts are set", () => {
    const req = makeRequest({
      status: "approved",
      depositAmount: 2000,
      balanceAmount: 3000,
      totalAmount: 5000,
    });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SEND_DEPOSIT_LINK", id: "test-001" });
    expect(next.requests[0].status).toBe("awaiting_deposit");
  });

  it("does nothing if amounts are null", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SEND_DEPOSIT_LINK", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });

  it("does nothing if status is not approved", () => {
    const req = makeRequest({
      status: "awaiting_deposit",
      depositAmount: 2000,
      balanceAmount: 3000,
      totalAmount: 5000,
    });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SEND_DEPOSIT_LINK", id: "test-001" });
    expect(next.requests[0].status).toBe("awaiting_deposit");
  });
});

describe("simulateDepositPayment", () => {
  it("transitions awaiting_deposit to deposit_paid and sets depositPaid", () => {
    const req = makeRequest({ status: "awaiting_deposit" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SIMULATE_DEPOSIT_PAYMENT", id: "test-001" });
    expect(next.requests[0].status).toBe("deposit_paid");
    expect(next.requests[0].depositPaid).toBe(true);
  });

  it("does nothing if status is not awaiting_deposit", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SIMULATE_DEPOSIT_PAYMENT", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });
});

describe("sendBalanceLink", () => {
  it("transitions deposit_paid to awaiting_balance", () => {
    const req = makeRequest({ status: "deposit_paid", depositPaid: true });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SEND_BALANCE_LINK", id: "test-001" });
    expect(next.requests[0].status).toBe("awaiting_balance");
  });

  it("does nothing if status is not deposit_paid", () => {
    const req = makeRequest({ status: "approved" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SEND_BALANCE_LINK", id: "test-001" });
    expect(next.requests[0].status).toBe("approved");
  });
});

describe("simulateBalancePayment", () => {
  it("transitions awaiting_balance to confirmed and sets balancePaid", () => {
    const req = makeRequest({ status: "awaiting_balance" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SIMULATE_BALANCE_PAYMENT", id: "test-001" });
    expect(next.requests[0].status).toBe("confirmed");
    expect(next.requests[0].balancePaid).toBe(true);
  });

  it("does nothing if status is not awaiting_balance", () => {
    const req = makeRequest({ status: "deposit_paid" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "SIMULATE_BALANCE_PAYMENT", id: "test-001" });
    expect(next.requests[0].status).toBe("deposit_paid");
  });
});

describe("cancelRequest", () => {
  it("transitions any active status to cancelled", () => {
    for (const status of ["pending_review", "approved", "awaiting_deposit", "confirmed"] as const) {
      const req = makeRequest({ status });
      const state = { requests: [req] };
      const next = requestReducer(state, { type: "CANCEL_REQUEST", id: "test-001" });
      expect(next.requests[0].status).toBe("cancelled");
    }
  });
});

describe("markCompleted", () => {
  it("transitions to completed", () => {
    const req = makeRequest({ status: "confirmed" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "MARK_COMPLETED", id: "test-001" });
    expect(next.requests[0].status).toBe("completed");
  });
});

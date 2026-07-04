import { describe, it, expect } from "vitest";
import { requestReducer, validateTotalAmount } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";

function makeRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    id: "test-001",
    reference: "REQ-TEST-001",
    activityName: "Test Activity",
    fullName: "Test Customer",
    email: "test@test.com",
    phone: "+230 5000 0000",
    adults: 2,
    children: 0,
    startDate: "2026-07-01",
    endDate: null,
    message: "",
    formType: "activity",
    partySize: 2,
    status: "pending_review",
    totalAmount: null,
    paid: false,
    createdAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("validateTotalAmount", () => {
  it("returns valid for a positive amount", () => {
    expect(validateTotalAmount(5000)).toEqual({ valid: true });
  });

  it("returns invalid for zero", () => {
    const result = validateTotalAmount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for a negative amount", () => {
    const result = validateTotalAmount(-100);
    expect(result.valid).toBe(false);
  });

  it("returns invalid for NaN", () => {
    const result = validateTotalAmount(NaN);
    expect(result.valid).toBe(false);
  });
});

describe("cancelRequest", () => {
  it("transitions any active status to cancelled", () => {
    for (const status of [
      "pending_review",
      "approved",
      "awaiting_payment",
      "confirmed",
    ] as const) {
      const req = makeRequest({ status });
      const state = { requests: [req] };
      const next = requestReducer(state, { type: "CANCEL_REQUEST", id: "test-001" });
      expect(next.requests[0].status).toBe("cancelled");
    }
  });

  it("does nothing if already completed", () => {
    const req = makeRequest({ status: "completed" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "CANCEL_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("completed");
  });

  it("leaves other requests unchanged", () => {
    const req1 = makeRequest({ id: "test-001", status: "pending_review" });
    const req2 = makeRequest({ id: "test-002", status: "pending_review" });
    const state = { requests: [req1, req2] };
    const next = requestReducer(state, { type: "CANCEL_REQUEST", id: "test-001" });
    expect(next.requests[0].status).toBe("cancelled");
    expect(next.requests[1].status).toBe("pending_review");
  });
});

describe("markCompleted", () => {
  it("transitions to completed", () => {
    const req = makeRequest({ status: "confirmed" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "MARK_COMPLETED", id: "test-001" });
    expect(next.requests[0].status).toBe("completed");
  });

  it("does nothing if already cancelled", () => {
    const req = makeRequest({ status: "cancelled" });
    const state = { requests: [req] };
    const next = requestReducer(state, { type: "MARK_COMPLETED", id: "test-001" });
    expect(next.requests[0].status).toBe("cancelled");
  });
});

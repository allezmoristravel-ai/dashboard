import { describe, it, expect } from "vitest";
import {
  detectConflicts,
  conflictsForRequest,
  conflictsForDate,
  type ConflictableRequest,
} from "@/lib/conflicts";
import type { RequestStatus } from "@/lib/types";

function makeReq(
  overrides: Partial<ConflictableRequest> & { id: string }
): ConflictableRequest {
  return {
    activityRef: "act-1",
    activityName: "Sunset Cruise",
    startDate: "2026-08-12",
    endDate: null,
    status: "pending_review" as RequestStatus,
    ...overrides,
  };
}

describe("detectConflicts", () => {
  it("returns no conflicts for a single request", () => {
    const groups = detectConflicts([makeReq({ id: "a" })]);
    expect(groups).toEqual([]);
  });

  it("returns no conflicts for unrelated requests", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", activityRef: "act-1", startDate: "2026-08-12" }),
      makeReq({ id: "b", activityRef: "act-2", startDate: "2026-08-20" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("flags a soft conflict when 2+ pending_review requests collide", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", status: "pending_review" }),
      makeReq({ id: "b", status: "pending_review" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].severity).toBe("soft");
    expect(groups[0].requestIds).toEqual(["a", "b"]);
  });

  it("flags a hard conflict when a committed request collides with a pending one", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", status: "approved" }),
      makeReq({ id: "b", status: "pending_review" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].severity).toBe("hard");
  });

  it("flags double_booked when 2+ committed requests collide", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", status: "confirmed" }),
      makeReq({ id: "b", status: "awaiting_payment" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].severity).toBe("double_booked");
  });

  it("does not collide requests for different activities on the same day", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", activityRef: "act-1", startDate: "2026-08-12" }),
      makeReq({ id: "b", activityRef: "act-2", startDate: "2026-08-12" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("does not collide the same activity on different days", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", startDate: "2026-08-12" }),
      makeReq({ id: "b", startDate: "2026-08-13" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("ignores declined and cancelled requests", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", status: "declined" }),
      makeReq({ id: "b", status: "cancelled" }),
      makeReq({ id: "c", status: "pending_review" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("ignores completed requests", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", status: "completed" }),
      makeReq({ id: "b", status: "pending_review" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("ignores requests with no activity_ref", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", activityRef: null }),
      makeReq({ id: "b", activityRef: null }),
    ]);
    expect(groups).toEqual([]);
  });

  it("flags overlapping-but-not-identical date ranges for the same activity", () => {
    const groups = detectConflicts([
      makeReq({
        id: "a",
        status: "approved",
        startDate: "2026-08-05",
        endDate: "2026-08-12",
      }),
      makeReq({
        id: "b",
        status: "pending_review",
        startDate: "2026-08-08",
        endDate: "2026-08-15",
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].severity).toBe("hard");
    expect(groups[0].startDate).toBe("2026-08-08");
    expect(groups[0].endDate).toBe("2026-08-12");
    expect(groups[0].requestIds).toEqual(["a", "b"]);
  });

  it("does not collide back-to-back ranges (end date immediately before next start)", () => {
    const groups = detectConflicts([
      makeReq({ id: "a", startDate: "2026-08-01", endDate: "2026-08-05" }),
      makeReq({ id: "b", startDate: "2026-08-06", endDate: "2026-08-10" }),
    ]);
    expect(groups).toEqual([]);
  });

  it("sorts groups double_booked first, then hard, then soft", () => {
    const groups = detectConflicts([
      // soft group on act-1
      makeReq({ id: "a", activityRef: "act-1", startDate: "2026-08-01" }),
      makeReq({ id: "b", activityRef: "act-1", startDate: "2026-08-01" }),
      // double_booked group on act-2
      makeReq({
        id: "c",
        activityRef: "act-2",
        startDate: "2026-08-02",
        status: "confirmed",
      }),
      makeReq({
        id: "d",
        activityRef: "act-2",
        startDate: "2026-08-02",
        status: "approved",
      }),
      // hard group on act-3
      makeReq({
        id: "e",
        activityRef: "act-3",
        startDate: "2026-08-03",
        status: "approved",
      }),
      makeReq({
        id: "f",
        activityRef: "act-3",
        startDate: "2026-08-03",
        status: "pending_review",
      }),
    ]);
    expect(groups.map((g) => g.severity)).toEqual([
      "double_booked",
      "hard",
      "soft",
    ]);
  });
});

describe("conflictsForRequest", () => {
  it("returns groups containing the given request id", () => {
    const groups = detectConflicts([
      makeReq({ id: "a" }),
      makeReq({ id: "b" }),
    ]);
    expect(conflictsForRequest(groups, "a")).toHaveLength(1);
    expect(conflictsForRequest(groups, "zzz")).toEqual([]);
  });
});

describe("conflictsForDate", () => {
  it("returns groups whose date range includes the given date", () => {
    const groups = detectConflicts([
      makeReq({
        id: "a",
        status: "approved",
        startDate: "2026-08-05",
        endDate: "2026-08-12",
      }),
      makeReq({
        id: "b",
        status: "pending_review",
        startDate: "2026-08-08",
        endDate: "2026-08-15",
      }),
    ]);
    expect(conflictsForDate(groups, "2026-08-10")).toHaveLength(1);
    expect(conflictsForDate(groups, "2026-08-01")).toEqual([]);
    expect(conflictsForDate(groups, "2026-08-15")).toEqual([]);
  });
});

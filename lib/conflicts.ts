import type { RequestStatus } from "./types";

// See "Calendar conflict rules" in README.md for the plain-language version
// of what this file implements and how to change it.

export type ConflictSeverity = "soft" | "hard" | "double_booked";

export interface ConflictableRequest {
  id: string;
  activityRef: string | null;
  activityName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD, inclusive; null means single-day (= startDate)
  status: RequestStatus;
}

export interface ConflictGroup {
  key: string;
  activityRef: string;
  activityName: string;
  startDate: string; // inclusive
  endDate: string; // inclusive
  severity: ConflictSeverity;
  requestIds: string[];
}

// Requests in these statuses can still collide with something else.
const ACTIVE_STATUSES = new Set<RequestStatus>([
  "pending_review",
  "approved",
  "awaiting_payment",
  "confirmed",
  "reminded",
]);

// A subset of ACTIVE_STATUSES: the owner has already committed to these.
const COMMITTED_STATUSES = new Set<RequestStatus>([
  "approved",
  "awaiting_payment",
  "confirmed",
  "reminded",
]);

export const SEVERITY_RANK: Record<ConflictSeverity, number> = {
  double_booked: 0,
  hard: 1,
  soft: 2,
};

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function severityFor(members: ConflictableRequest[]): ConflictSeverity {
  const committedCount = members.filter((m) =>
    COMMITTED_STATUSES.has(m.status)
  ).length;
  const pendingCount = members.length - committedCount;
  if (committedCount >= 2) return "double_booked";
  if (committedCount >= 1 && pendingCount >= 1) return "hard";
  return "soft";
}

// Sweep-line over one activity's date ranges: walk the sorted start/end
// boundaries and emit a group for every maximal sub-interval where 2+
// requests are simultaneously active. A single-day request (endDate null)
// degenerates to a one-day interval, so this also covers exact-date matches.
function detectConflictsForActivity(
  activityRef: string,
  activityName: string,
  requests: ConflictableRequest[]
): ConflictGroup[] {
  interface Boundary {
    date: string;
    starts: ConflictableRequest[];
    ends: ConflictableRequest[];
  }

  const boundaryMap = new Map<string, Boundary>();
  function boundary(date: string): Boundary {
    let b = boundaryMap.get(date);
    if (!b) {
      b = { date, starts: [], ends: [] };
      boundaryMap.set(date, b);
    }
    return b;
  }

  for (const r of requests) {
    const end = r.endDate ?? r.startDate;
    boundary(r.startDate).starts.push(r);
    boundary(addDays(end, 1)).ends.push(r);
  }

  const boundaries = Array.from(boundaryMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const active = new Map<string, ConflictableRequest>();
  const groups: ConflictGroup[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    for (const r of b.ends) active.delete(r.id);
    for (const r of b.starts) active.set(r.id, r);

    if (active.size >= 2) {
      const segStart = b.date;
      const segEndExclusive =
        i + 1 < boundaries.length ? boundaries[i + 1].date : segStart;
      const segEnd = addDays(segEndExclusive, -1);
      const members = Array.from(active.values());
      groups.push({
        key: `${activityRef}|${segStart}|${segEnd}`,
        activityRef,
        activityName,
        startDate: segStart,
        endDate: segEnd,
        severity: severityFor(members),
        requestIds: members.map((m) => m.id).sort(),
      });
    }
  }

  return groups;
}

export function detectConflicts(
  requests: ConflictableRequest[]
): ConflictGroup[] {
  const active = requests.filter(
    (r) => ACTIVE_STATUSES.has(r.status) && r.activityRef
  );

  const byActivity = new Map<string, ConflictableRequest[]>();
  for (const r of active) {
    const list = byActivity.get(r.activityRef as string);
    if (list) list.push(r);
    else byActivity.set(r.activityRef as string, [r]);
  }

  const groups: ConflictGroup[] = [];
  for (const [activityRef, reqs] of byActivity) {
    if (reqs.length < 2) continue;
    groups.push(
      ...detectConflictsForActivity(activityRef, reqs[0].activityName, reqs)
    );
  }

  return groups.sort((a, b) => {
    const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (rankDiff !== 0) return rankDiff;
    return a.startDate.localeCompare(b.startDate);
  });
}

export function conflictsForRequest(
  groups: ConflictGroup[],
  requestId: string
): ConflictGroup[] {
  return groups.filter((g) => g.requestIds.includes(requestId));
}

export function conflictsForDate(
  groups: ConflictGroup[],
  date: string
): ConflictGroup[] {
  return groups.filter((g) => date >= g.startDate && date <= g.endDate);
}

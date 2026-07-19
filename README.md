This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Calendar view & conflict rules

`/calendar` (`app/calendar/page.tsx`, `components/calendar/*`) shows booking
requests on a FullCalendar month/week/list grid and flags scheduling
conflicts. It reads from the same `useRequests()` store as the inbox — no
separate Supabase connection or realtime subscription — since the store
already loads the full request list app-wide and the two-connection rule
already scopes it to direct SDK reads.

**Collision unit**: two active requests conflict when they share the same
`activity_ref` and their `[start_date, end_date]` ranges overlap (a
single-day request with `end_date = null` is treated as a one-day range).
This is a deliberate extension of "same activity, same day": real requests
for rentals/accommodation span date ranges, so range overlap (not just exact
date equality) is what actually double-books an activity.

**Active vs. committed statuses** (`lib/conflicts.ts`):
- ACTIVE = `pending_review`, `approved`, `awaiting_payment`, `confirmed`, `reminded`
  (i.e. everything except `declined`, `cancelled`, `completed` — those can't
  collide with anything).
- COMMITTED = `approved`, `awaiting_payment`, `confirmed`, `reminded` — the
  owner has already committed to these.

**Severity**, per group of overlapping active requests on the same activity:
- `soft` — all members are `pending_review`. Informational only.
- `hard` — at least one COMMITTED member and at least one `pending_review`
  member. The "something's approved and a new request came in" case.
- `double_booked` — 2+ COMMITTED members. Already promised twice.

`detectConflicts()` sweeps each activity's date ranges chronologically and
emits one `ConflictGroup` per maximal sub-interval where 2+ requests are
simultaneously active, so a single pair of long, only-partially-overlapping
ranges is reported with the exact overlapping window, not their full spans.
`conflictsForRequest()` and `conflictsForDate()` are small lookup helpers
over the resulting group list, used to flag event chips and day cells.

**To change the rules**: edit `ACTIVE_STATUSES` / `COMMITTED_STATUSES` /
`severityFor()` in `lib/conflicts.ts` — `detectConflicts` itself doesn't need
to change. `lib/conflicts.test.ts` (in `__tests__/`) covers the no-conflict,
soft, hard, double-booked, cross-activity, cross-date, ignored-status, and
range-overlap cases; add a case there before changing the rule.

**Status colours** on the calendar reuse `STATUS_COLORS` from `lib/types.ts`
unchanged (the same tokens `StatusBadge` uses in the inbox) — see
`lib/calendar-styles.ts` for the border-style/opacity/icon/default-visibility
metadata layered on top.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

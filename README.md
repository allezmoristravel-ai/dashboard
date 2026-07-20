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

## Table view

`/table` (`app/table/page.tsx`, `components/table/*`) is a dense, sortable,
filterable table over `booking.requests`, for browsing many bookings at once
instead of the inbox's cards or the calendar's grid.

**Default columns**: ⚠ conflict indicator, Status, Guest, Activity, Date,
Party, Amount. **Hidden by default, available via the "Columns" picker**:
Email, Phone, Submitted, Reference, Message, QuickBooks refs. Column
visibility is defined in `lib/table-query.ts`
(`TABLE_COLUMN_IDS`/`DEFAULT_TABLE_COLUMNS`/`COLUMN_LABELS`) — add a column
there, wire its cell in `components/table/request-table.tsx`, and (if it
should sort) add it to `SORTABLE_FIELDS`.

**Why these defaults**: chosen from the live schema, not the doc this feature
was speced from — `reference` and `activity_ref` are 100% null in current
data (so `activity_ref`-based conflict detection can't fire on real bookings
yet, and `reference` is hidden rather than defaulted-on), `notes` is a
db column the app has never read, and `payments`/`messages` are currently
empty tables. "Payment state" is derived from `requests.total_amount`/`paid`
directly rather than joining `payments`, so it isn't permanently blank.

**State in the URL**: filters, sort, and visible columns all serialise into
the query string (`lib/table-query.ts`: `parseTableSearchParams` /
`tableStateToSearchParams`), so a filtered/sorted view is a shareable link
that survives refresh. Visible columns also persist to `localStorage`
(`table-visible-columns`) as the fallback when the URL doesn't specify
`cols` — an explicit `?cols=` in a shared link always wins over what's
stored locally on the device that opens it.

**Data path**: paginated (`.range()`, page size 50) and filtered server-side
via `lib/use-table-requests.ts`, which opens its own Supabase query/Realtime
channel — deliberately separate from `useRequests()` in `lib/store.tsx`,
which loads the *entire* unpaginated list for the inbox/calendar and isn't
shaped for range/order/filter queries. Row actions (approve, decline, cancel,
mark completed) still go through the shared `useRequests()` handlers in
`lib/store.tsx` unchanged — same n8n-webhook-vs-direct-SDK-write split as the
inbox, nothing new.

**Conflict detection** reuses `detectConflicts()` from `lib/conflicts.ts`
unchanged, computed over the full (unpaginated) request list already held in
the app-wide store — not the table's current page — so a conflict spanning
two pages is still found. The "conflicts only" filter passes that ID set to
the server query as an `.in("id", …)` filter.

**Mobile** (below `sm`): the table collapses to the same `RequestCard` list
component the inbox uses, rather than a horizontally-scrolling table — the
owner runs this installed on his phone, and reusing the card view means no
new layout to design for a cramped screen, at the cost of the extra columns
(email, phone, etc.) only being one tap away on the detail page.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

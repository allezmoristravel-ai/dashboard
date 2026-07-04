# Owner Dashboard — CLAUDE.md

## Architecture rules

- **Store seam**: All state mutations live in `lib/store.ts`. Components are
  presentational and call store actions — they never touch mock data directly.
  This is the single seam for the future Supabase swap; only `store.ts` imports
  from `mock-data.ts`.

- **Presentational components**: Components call store actions via the
  `useRequests()` hook. They never import mock data or mutate state directly.

- **TDD on logic, not UI**: Tests cover store logic (`validateTotalAmount`,
  `requestReducer`, etc.). Presentational components (cards, badges, dialogs)
  do not need unit tests.

- **Two-connection rule**: reads/writes go directly dashboard ↔ Supabase via
  the SDK. Side effects (emails, payment links, QuickBooks) go through n8n
  webhooks — the dashboard never calls QuickBooks, MobiPaid, or email APIs
  directly. `sendPayment`/`declineRequest` in `lib/store.tsx` call the n8n
  WF-2 webhook and do NOT write `booking.requests.status` themselves; Supabase
  Realtime (subscribed in `RequestProvider`) reflects the resulting write back
  to the UI. Plain status writes with no side effect (`cancelRequest`,
  `markCompleted`) still go direct via the SDK.

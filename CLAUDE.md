# Owner Dashboard — CLAUDE.md

## Architecture rules

- **Store seam**: All state mutations live in `lib/store.ts`. Components are
  presentational and call store actions — they never touch mock data directly.
  This is the single seam for the future Supabase swap; only `store.ts` imports
  from `mock-data.ts`.

- **Presentational components**: Components call store actions via the
  `useRequests()` hook. They never import mock data or mutate state directly.

- **TDD on logic, not UI**: Tests cover store logic (`approveRequest`,
  `setAmounts`, `sendDepositLink`, etc.). Presentational components (cards,
  badges, dialogs) do not need unit tests.

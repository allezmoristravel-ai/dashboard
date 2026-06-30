# CONTEXT.md — Owner Dashboard (Booking Manager)

Project glossary and durable decisions. The agent should read this at the start
of each session and add new terms here as they're coined.

## What this is
A single-owner dashboard for a tourism booking-request platform. The owner
manually reviews booking **requests**. There is NO booking engine and NO
availability logic — the owner approves each request by hand and sets prices
case by case.

## The request lifecycle (status machine)
A request moves through these statuses:
- `pending_review` — just came in, owner hasn't acted yet
- `declined` — owner rejected it
- `approved` — owner approved but amounts not set yet
- `awaiting_deposit` — amounts set, deposit link "sent", waiting on payment
- `deposit_paid` — deposit came back paid
- `awaiting_balance` — waiting on the remaining balance
- `confirmed` — fully paid / locked in
- `reminded` — a reminder was sent
- `completed` — activity done
- `cancelled` — cancelled after the fact

## The core flow: approve → review amounts → send deposit link
This is three DELIBERATE, SEPARATE steps. Approving never sends anything;
sending is its own explicit confirm step.
1. **Approve** — `pending_review` → `approved`. State change only, no message.
2. **Review amounts** — on an `approved` request, owner edits `depositAmount`,
   `balanceAmount`, `totalAmount`. Pre-filled from a mock default price but
   fully editable (custom/seasonal pricing). Rule: all positive, deposit ≤ total,
   balance auto-computes as total − deposit (override allowed, warn on mismatch).
3. **Send deposit link** — confirms amounts, `approved` → `awaiting_deposit`.
   The real link/email is mocked for now.

## The store seam (key architectural decision)
ALL state mutations live in `lib/store.ts` (`approveRequest`, `declineRequest`,
`setAmounts`, `sendDepositLink`, `cancelRequest`, etc.). Components are
presentational and call these actions — they never touch data directly. This is
the single seam where mock state gets swapped for Supabase later. Do not scatter
mutations or mock data anywhere else.

## What is deliberately mocked / out of scope (for the current UI-only stage)
- No auth / login (placeholder user area only)
- No Supabase, no real DB, no API keys, no `.env`
- No n8n / webhook / MobiPaid / email calls — payment + messaging are faked with
  local state changes and toasts
- No PWA / manifest / service worker
- A dev-only "simulate payment" control flips `depositPaid` / `balancePaid` so
  payment-driven status advances can be tested by hand

## Next stage (not yet built)
Supabase + auth wiring, which slots into the `lib/store.ts` seam. The store's
action functions are the only things that change.
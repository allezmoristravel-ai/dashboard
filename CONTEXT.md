# CONTEXT.md — Owner Dashboard (Booking Manager)

Project glossary and durable decisions. The agent should read this at the start
of each session and add new terms here as they're coined.

## What this is
A single-owner dashboard for a tourism booking-request platform. The owner
manually reviews booking **requests**. There is NO booking engine and NO
availability logic — the owner approves each request by hand and sets prices
case by case.

## The request lifecycle (status machine)
A request moves through these statuses (real `booking.requests.status` enum):
- `pending_review` — just came in, owner hasn't acted yet
- `declined` — owner rejected it
- `approved` — reserved by the schema; the dashboard's approve action currently
  skips straight from `pending_review` to `awaiting_payment` (see below)
- `awaiting_payment` — owner approved with a price, n8n created a QuickBooks
  invoice + MobiPaid payment link and emailed the customer
- `confirmed` — MobiPaid confirmed payment; n8n flips this automatically
- `reminded` — a reminder was sent (WF-4, cron-based, no dashboard involvement)
- `completed` — activity done
- `cancelled` — cancelled after the fact

## The core flow: approve & send payment, or decline
Two owner actions on a `pending_review` request, both fire a POST to the n8n
WF-2 webhook (`https://n8n.srv1766517.hstgr.cloud/webhook/wf2`):
1. **Approve** — owner enters a total price in the "Approve & Send Payment"
   dialog. Sends `{ request_id, action: "send_payment", total_amount }`. n8n
   creates the QuickBooks invoice, the `booking.payments` row, the MobiPaid
   link, sends the email, and writes `status: awaiting_payment`.
2. **Decline** — owner may add a note. Sends
   `{ request_id, action: "decline", note? }`. n8n writes `status: declined`.

The dashboard never writes `booking.requests.status` for these two actions —
n8n owns that write to avoid racing with it. Supabase Realtime (subscribed in
`RequestProvider`) reflects the result back into the UI automatically,
including the later automatic `awaiting_payment` → `confirmed` transition once
MobiPaid confirms payment (no dashboard action involved in that step).

A failed webhook call (network error or non-2xx) surfaces as a visible toast
error and leaves the request in `pending_review` — the owner needs to know so
they can retry, since nothing else indicates the click didn't work.

WF-1 (request intake, Supabase-trigger-driven) and WF-4 (reminders, cron-based)
have no dashboard involvement and should not be touched from here.

## The store seam (key architectural decision)
ALL state mutations live in `lib/store.tsx` (`sendPayment`, `declineRequest`,
`cancelRequest`, `markCompleted`). Components are presentational and call
these actions — they never touch Supabase or n8n directly. This is the single
seam where data access changes.

## Payments (`booking.payments`)
One row per payment attempt, linked via `request_id`. Includes
`quickbooks_invoice_id` / `quickbooks_customer_id` / `quickbooks_payment_id`
for reconciliation — surfaced as a small reference on the request detail page
when present. The dashboard reads this table directly (read-only,
`fetchPaymentForRequest` in the store); it never writes to it — n8n does.

## What is out of scope here
- No auth / login (placeholder user area only)
- No shared-secret / signature validation on the WF-2 webhook yet (flagged to
  the owner separately — anyone with the URL can currently call it)
- No PWA / manifest / service worker

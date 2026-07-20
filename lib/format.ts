// Shared formatting helpers — extracted from request-card.tsx / request-detail.tsx,
// which both had identical copies. Same en-GB date convention and EUR prefix
// everywhere in the dashboard (inbox, calendar, table).

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEUR(amount: number | null): string {
  if (amount === null) return "—";
  return `EUR ${amount.toLocaleString()}`;
}

export function formatPartySize(adults: number, children: number): string {
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`];
  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  }
  return parts.join(", ");
}

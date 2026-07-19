import { STATUS_COLORS, type RequestStatus } from "./types";

// Visual treatment per status for the calendar view. Colours are NOT
// duplicated here — they come straight from STATUS_COLORS (lib/types.ts),
// the same tokens the inbox's StatusBadge uses. This file only adds the
// calendar-specific metadata (border style, fill strength, default
// visibility) layered on top of those shared colours.
export interface CalendarStatusStyle {
  border: "solid" | "dashed";
  mutedFill: boolean;
  hiddenByDefault: boolean;
  showPaymentIcon: boolean;
}

export const CALENDAR_STATUS_STYLE: Record<RequestStatus, CalendarStatusStyle> = {
  pending_review: {
    border: "dashed",
    mutedFill: true,
    hiddenByDefault: false,
    showPaymentIcon: false,
  },
  approved: {
    border: "solid",
    mutedFill: false,
    hiddenByDefault: false,
    showPaymentIcon: false,
  },
  awaiting_payment: {
    border: "solid",
    mutedFill: false,
    hiddenByDefault: false,
    showPaymentIcon: true,
  },
  confirmed: {
    border: "solid",
    mutedFill: false,
    hiddenByDefault: false,
    showPaymentIcon: false,
  },
  reminded: {
    border: "solid",
    mutedFill: true,
    hiddenByDefault: false,
    showPaymentIcon: false,
  },
  completed: {
    border: "solid",
    mutedFill: true,
    hiddenByDefault: false,
    showPaymentIcon: false,
  },
  declined: {
    border: "solid",
    mutedFill: true,
    hiddenByDefault: true,
    showPaymentIcon: false,
  },
  cancelled: {
    border: "solid",
    mutedFill: true,
    hiddenByDefault: true,
    showPaymentIcon: false,
  },
};

export function chipClassesForStatus(status: RequestStatus): string {
  return STATUS_COLORS[status];
}

export const DEFAULT_VISIBLE_STATUSES: RequestStatus[] = (
  Object.keys(CALENDAR_STATUS_STYLE) as RequestStatus[]
).filter((s) => !CALENDAR_STATUS_STYLE[s].hiddenByDefault);

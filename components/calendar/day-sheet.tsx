"use client";

import { AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RequestCard } from "@/components/request-card";
import {
  ACTIVE_STATUS_ORDER,
  ARCHIVE_STATUSES,
  STATUS_LABELS,
  type BookingRequest,
} from "@/lib/types";
import type { ConflictGroup } from "@/lib/conflicts";

interface DaySheetProps {
  date: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: BookingRequest[];
  conflicts: ConflictGroup[];
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function conflictExplanation(c: ConflictGroup) {
  if (c.severity === "double_booked") {
    return "2 or more of these are already approved or paid — this is a double-booking.";
  }
  if (c.severity === "hard") {
    return "one of these is already approved or paid while another is still pending review.";
  }
  return "all of these are still pending review, but they'd overlap if both were approved.";
}

export function DaySheet({
  date,
  open,
  onOpenChange,
  requests,
  conflicts,
}: DaySheetProps) {
  const groups = [...ACTIVE_STATUS_ORDER, ...ARCHIVE_STATUSES]
    .map((status) => ({
      status,
      items: requests.filter((r) => r.status === status),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{date ? formatDate(date) : "Day"}</SheetTitle>
          <SheetDescription>
            {requests.length} request{requests.length === 1 ? "" : "s"} on this
            day
          </SheetDescription>
        </SheetHeader>

        {conflicts.length > 0 && (
          <div className="space-y-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            {conflicts.map((c) => (
              <div key={c.key} className="flex items-start gap-2 text-sm">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  strokeWidth={2}
                />
                <p className="text-foreground">
                  <span className="font-medium">{c.activityName}</span> has{" "}
                  {c.requestIds.length} overlapping requests —{" "}
                  {conflictExplanation(c)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 space-y-6 overflow-y-auto">
          {requests.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No requests on this day.
            </p>
          )}
          {groups.map((group) => (
            <section key={group.status}>
              <div className="mb-2.5 flex items-baseline gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {STATUS_LABELS[group.status]}
                </h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

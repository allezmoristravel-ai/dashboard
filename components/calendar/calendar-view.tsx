"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  DayCellContentArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { AlertTriangle, Clock } from "lucide-react";

import { useRequests } from "@/lib/store";
import {
  REQUEST_STATUSES,
  type BookingRequest,
  type RequestStatus,
} from "@/lib/types";
import {
  detectConflicts,
  conflictsForDate,
  conflictsForRequest,
  addDays,
  SEVERITY_RANK,
  type ConflictableRequest,
  type ConflictGroup,
  type ConflictSeverity,
} from "@/lib/conflicts";
import {
  CALENDAR_STATUS_STYLE,
  chipClassesForStatus,
  DEFAULT_VISIBLE_STATUSES,
} from "@/lib/calendar-styles";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/calendar/filter-bar";
import { ConflictRail } from "@/components/calendar/conflict-rail";
import { DaySheet } from "@/components/calendar/day-sheet";
import "@/components/calendar/fullcalendar-theme.css";

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function worstSeverity(conflicts: ConflictGroup[]): ConflictSeverity | null {
  if (conflicts.length === 0) return null;
  return conflicts.reduce<ConflictSeverity>(
    (acc, c) => (SEVERITY_RANK[c.severity] < SEVERITY_RANK[acc] ? c.severity : acc),
    conflicts[0].severity
  );
}

function EventChip({ arg }: { arg: EventContentArg }) {
  const request = arg.event.extendedProps.request as BookingRequest;
  const severity = arg.event.extendedProps.conflictSeverity as
    | ConflictSeverity
    | null;
  const style = CALENDAR_STATUS_STYLE[request.status];
  const isList = arg.view.type.startsWith("list");

  const tooltip = severity
    ? `Conflict: ${request.activityName} on ${request.startDate} has other overlapping bookings`
    : undefined;

  return (
    <div
      title={tooltip}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-[11px] leading-tight",
        chipClassesForStatus(request.status),
        style.border === "dashed" ? "border-dashed" : "border-solid",
        style.mutedFill && "opacity-75",
        severity && "ring-1 ring-destructive",
        severity === "double_booked" && "ring-2"
      )}
    >
      {severity && (
        <AlertTriangle className="size-3 shrink-0" strokeWidth={2.5} />
      )}
      {style.showPaymentIcon && <Clock className="size-3 shrink-0" strokeWidth={2} />}
      <span className="truncate font-medium">{request.activityName}</span>
      <span className="truncate text-[10px] opacity-80">
        &middot; {request.fullName} &middot; {request.partySize}p
      </span>
      {isList && (
        <span className="ml-auto shrink-0 font-mono text-[10px] opacity-70">
          {request.reference}
        </span>
      )}
    </div>
  );
}

export function CalendarView() {
  const { requests, loading } = useRequests();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);

  const [visibleRange, setVisibleRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialView] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches
      ? "listWeek"
      : "dayGridMonth"
  );

  const selectedStatuses = useMemo<RequestStatus[]>(() => {
    const raw = searchParams.get("status");
    if (!raw) return DEFAULT_VISIBLE_STATUSES;
    const known = new Set<string>(REQUEST_STATUSES);
    const parsed = raw.split(",").filter((s) => known.has(s)) as RequestStatus[];
    return parsed.length > 0 ? parsed : DEFAULT_VISIBLE_STATUSES;
  }, [searchParams]);

  const selectedActivity = searchParams.get("activity");

  const updateParams = useCallback(
    (next: { status?: RequestStatus[]; activity?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.status) params.set("status", next.status.join(","));
      if ("activity" in next) {
        if (next.activity) params.set("activity", next.activity);
        else params.delete("activity");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const handleToggleStatus = useCallback(
    (status: RequestStatus) => {
      const next = selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status];
      updateParams({ status: next });
    },
    [selectedStatuses, updateParams]
  );

  const handleChangeActivity = useCallback(
    (activity: string | null) => updateParams({ activity }),
    [updateParams]
  );

  const activities = useMemo(
    () => Array.from(new Set(requests.map((r) => r.activityName))).sort(),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          selectedStatuses.includes(r.status) &&
          (!selectedActivity || r.activityName === selectedActivity)
      ),
    [requests, selectedStatuses, selectedActivity]
  );

  const conflictGroups = useMemo(() => {
    const inputs: ConflictableRequest[] = filteredRequests.map((r) => ({
      id: r.id,
      activityRef: r.activityRef,
      activityName: r.activityName,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    }));
    return detectConflicts(inputs);
  }, [filteredRequests]);

  const groupsInView = useMemo(() => {
    if (!visibleRange) return conflictGroups;
    return conflictGroups.filter(
      (g) => g.startDate < visibleRange.end && g.endDate >= visibleRange.start
    );
  }, [conflictGroups, visibleRange]);

  const events = useMemo<EventInput[]>(
    () =>
      filteredRequests.map((r) => {
        const conflicts = conflictsForRequest(conflictGroups, r.id);
        return {
          id: r.id,
          start: r.startDate,
          end: addDays(r.endDate ?? r.startDate, 1),
          allDay: true,
          extendedProps: {
            request: r,
            conflictSeverity: worstSeverity(conflicts),
          },
        };
      }),
    [filteredRequests, conflictGroups]
  );

  const sheetRequests = useMemo(() => {
    if (!sheetDate) return [];
    return filteredRequests.filter((r) => {
      const end = r.endDate ?? r.startDate;
      return sheetDate >= r.startDate && sheetDate <= end;
    });
  }, [filteredRequests, sheetDate]);

  const sheetConflicts = useMemo(
    () => (sheetDate ? conflictsForDate(conflictGroups, sheetDate) : []),
    [conflictGroups, sheetDate]
  );

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setVisibleRange({ start: dateToISO(arg.start), end: dateToISO(arg.end) });
  }, []);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setSheetDate(dateToISO(arg.date));
    setSheetOpen(true);
  }, []);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      arg.jsEvent.preventDefault();
      router.push(`/requests/${arg.event.id}`);
    },
    [router]
  );

  const handleJumpToDate = useCallback((date: string) => {
    calendarRef.current?.getApi().gotoDate(date);
    setSheetDate(date);
    setSheetOpen(true);
  }, []);

  const dayCellClassNames = useCallback(
    (arg: DayCellContentArg) => {
      const conflicts = conflictsForDate(conflictGroups, dateToISO(arg.date));
      if (conflicts.length === 0) return [];
      const worst = worstSeverity(conflicts);
      if (worst === "soft") return ["cal-conflict-soft"];
      return worst === "double_booked" ? ["cal-conflict-double"] : ["cal-conflict-hard"];
    },
    [conflictGroups]
  );

  const dayCellContent = useCallback(
    (arg: DayCellContentArg) => {
      const conflicts = conflictsForDate(conflictGroups, dateToISO(arg.date));
      const worst = worstSeverity(conflicts);
      return (
        <div className="flex w-full items-center justify-between gap-1 px-0.5">
          <span>{arg.dayNumberText}</span>
          {conflicts.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                worst === "soft"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              &#9888; {conflicts.length}
            </span>
          )}
        </div>
      );
    },
    [conflictGroups]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        activities={activities}
        selectedStatuses={selectedStatuses}
        selectedActivity={selectedActivity}
        onToggleStatus={handleToggleStatus}
        onChangeActivity={handleChangeActivity}
      />

      <ConflictRail
        groups={groupsInView}
        onJumpToDate={handleJumpToDate}
        defaultExpanded={
          typeof window === "undefined" ||
          !window.matchMedia("(max-width: 640px)").matches
        }
      />

      <div className="rounded-xl bg-card p-2 ring-1 ring-foreground/10 sm:p-3">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,listWeek",
          }}
          height="auto"
          events={events}
          editable={false}
          droppable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          dayMaxEventRows={3}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayCellClassNames={dayCellClassNames}
          dayCellContent={dayCellContent}
          eventContent={(arg) => <EventChip arg={arg} />}
        />
      </div>

      <DaySheet
        date={sheetDate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        requests={sheetRequests}
        conflicts={sheetConflicts}
      />
    </div>
  );
}

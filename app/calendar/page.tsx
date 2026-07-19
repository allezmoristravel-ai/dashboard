"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  { ssr: false }
);

function CalendarLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarLoading />}>
      <CalendarView />
    </Suspense>
  );
}

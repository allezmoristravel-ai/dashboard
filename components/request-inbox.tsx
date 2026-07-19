"use client";

import { useState } from "react";
import { ChevronDown, Inbox } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RequestCard } from "@/components/request-card";
import { useRequests } from "@/lib/store";
import {
  ACTIVE_STATUS_ORDER,
  ARCHIVE_STATUSES,
  STATUS_GROUP_LABELS,
  STATUS_LABELS,
  type RequestStatus,
} from "@/lib/types";

export function RequestInbox() {
  const { requests, loading } = useRequests();
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  function groupByStatus(statuses: RequestStatus[]) {
    return statuses
      .map((status) => ({
        status,
        items: requests.filter((r) => r.status === status),
      }))
      .filter((group) => group.items.length > 0);
  }

  const activeGroups = groupByStatus(ACTIVE_STATUS_ORDER);
  const archiveGroups = groupByStatus(ARCHIVE_STATUSES);
  const archiveCount = archiveGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-10">
      {activeGroups.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              No active requests
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              New booking requests will appear here as they come in.
            </p>
          </div>
        </div>
      )}

      {activeGroups.map((group) => (
        <section key={group.status}>
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              {STATUS_GROUP_LABELS[group.status] ?? STATUS_LABELS[group.status]}
            </h2>
            <span className="text-sm tabular-nums text-muted-foreground">
              {group.items.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      ))}

      {archiveCount > 0 && (
        <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
          <CollapsibleTrigger className="group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <ChevronDown className="size-4 transition-transform group-aria-expanded:rotate-180" />
            {archiveOpen ? "Hide" : "Show"} archive &amp; other
            <span className="tabular-nums">({archiveCount})</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-5 space-y-10">
            {archiveGroups.map((group) => (
              <section key={group.status}>
                <div className="mb-4 flex items-baseline gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                    {STATUS_LABELS[group.status]}
                  </h2>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {group.items.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((req) => (
                    <RequestCard key={req.id} request={req} />
                  ))}
                </div>
              </section>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

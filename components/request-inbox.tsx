"use client";

import { useState } from "react";
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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="space-y-8">
      {activeGroups.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          No active requests.
        </p>
      )}

      {activeGroups.map((group) => (
        <section key={group.status}>
          <h2 className="mb-3 text-lg font-semibold">
            {STATUS_GROUP_LABELS[group.status] ?? STATUS_LABELS[group.status]}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({group.items.length})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      ))}

      {archiveCount > 0 && (
        <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
          <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            {archiveOpen ? "Hide" : "Show"} archive / other ({archiveCount})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-8">
            {archiveGroups.map((group) => (
              <section key={group.status}>
                <h2 className="mb-3 text-lg font-semibold">
                  {STATUS_LABELS[group.status]}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({group.items.length})
                  </span>
                </h2>
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

"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConflictGroup, ConflictSeverity } from "@/lib/conflicts";

const SEVERITY_LABEL: Record<ConflictSeverity, string> = {
  double_booked: "Double-booked",
  hard: "Conflict",
  soft: "Possible overlap",
};

const SEVERITY_BADGE_CLASS: Record<ConflictSeverity, string> = {
  double_booked: "bg-red-100 text-red-800 border-red-200",
  hard: "bg-red-50 text-red-700 border-red-100",
  soft: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(`${start}T00:00:00`).toLocaleDateString("en-GB", opts);
  if (start === end) return s;
  const e = new Date(`${end}T00:00:00`).toLocaleDateString("en-GB", opts);
  return `${s} – ${e}`;
}

interface ConflictRailProps {
  groups: ConflictGroup[];
  onJumpToDate: (date: string) => void;
  defaultExpanded?: boolean;
}

export function ConflictRail({
  groups,
  onJumpToDate,
  defaultExpanded = true,
}: ConflictRailProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
        No conflicts in view
      </div>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-destructive/30 bg-card"
    >
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <CollapsibleTrigger className="group flex flex-1 items-center gap-2 text-left text-sm font-medium text-foreground">
          <AlertTriangle
            className="size-4 shrink-0 text-destructive"
            strokeWidth={2}
          />
          <span>
            {groups.length} conflict{groups.length === 1 ? "" : "s"} in view
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss conflict summary"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <CollapsibleContent>
        <div className="max-h-72 space-y-1.5 overflow-y-auto border-t border-border px-2.5 py-2.5">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => onJumpToDate(g.startDate)}
              className="flex w-full flex-col gap-1 rounded-md p-2 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {g.activityName}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[11px]",
                    SEVERITY_BADGE_CLASS[g.severity]
                  )}
                >
                  {SEVERITY_LABEL[g.severity]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{formatRange(g.startDate, g.endDate)}</span>
                <span aria-hidden>&middot;</span>
                <span>{g.requestIds.length} requests</span>
              </div>
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

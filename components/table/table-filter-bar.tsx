"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  REQUEST_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type RequestStatus,
} from "@/lib/types";
import type { TableFilters } from "@/lib/table-query";

interface TableFilterBarProps {
  activities: string[];
  filters: TableFilters;
  onChange: (next: Partial<TableFilters>) => void;
  conflictCount: number;
}

export function TableFilterBar({
  activities,
  filters,
  onChange,
  conflictCount,
}: TableFilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search);

  // Keep the input in sync if filters.search changes from outside (e.g. a
  // shared URL was opened with ?q= already set, or the back button was
  // used) — adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchDraft(filters.search);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchDraft !== filters.search) onChange({ search: searchDraft });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  function toggleStatus(status: RequestStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ statuses: next });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {REQUEST_STATUSES.map((status) => {
            const active =
              filters.statuses.length === 0 || filters.statuses.includes(status);
            return (
              <Badge
                key={status}
                variant="outline"
                render={<button type="button" />}
                aria-pressed={active}
                onClick={() => toggleStatus(status)}
                className={cn(
                  "min-h-[26px] cursor-pointer select-none px-2.5 py-1 text-xs transition-all",
                  active
                    ? STATUS_COLORS[status]
                    : "border-border text-muted-foreground opacity-60 hover:opacity-100"
                )}
              >
                {STATUS_LABELS[status]}
              </Badge>
            );
          })}
        </div>

        {activities.length > 0 && (
          <select
            aria-label="Filter by activity"
            value={filters.activity ?? ""}
            onChange={(e) => onChange({ activity: e.target.value || null })}
            className="h-8 w-full max-w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto dark:bg-input/30"
          >
            <option value="">All activities</option>
            {activities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="Requested date from"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value || null })}
            className="w-[140px]"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="Requested date to"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value || null })}
            className="w-[140px]"
          />
        </div>

        <Badge
          variant="outline"
          render={<button type="button" />}
          aria-pressed={filters.conflictsOnly}
          onClick={() => onChange({ conflictsOnly: !filters.conflictsOnly })}
          className={cn(
            "min-h-[26px] cursor-pointer select-none gap-1 px-2.5 py-1 text-xs transition-all",
            filters.conflictsOnly
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground opacity-60 hover:opacity-100"
          )}
        >
          <AlertTriangle className="size-3" strokeWidth={2.5} />
          Conflicts only
          {conflictCount > 0 && (
            <span className="tabular-nums">({conflictCount})</span>
          )}
        </Badge>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search name, email, reference…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
}

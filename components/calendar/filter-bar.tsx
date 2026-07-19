"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  REQUEST_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type RequestStatus,
} from "@/lib/types";

interface FilterBarProps {
  activities: string[];
  selectedStatuses: RequestStatus[];
  selectedActivity: string | null;
  onToggleStatus: (status: RequestStatus) => void;
  onChangeActivity: (activity: string | null) => void;
}

export function FilterBar({
  activities,
  selectedStatuses,
  selectedActivity,
  onToggleStatus,
  onChangeActivity,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {REQUEST_STATUSES.map((status) => {
          const active = selectedStatuses.includes(status);
          return (
            <Badge
              key={status}
              variant="outline"
              render={<button type="button" />}
              aria-pressed={active}
              onClick={() => onToggleStatus(status)}
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
          value={selectedActivity ?? ""}
          onChange={(e) => onChangeActivity(e.target.value || null)}
          className="h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">All activities</option>
          {activities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

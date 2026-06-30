"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  COLUMN_LABELS,
  TABLE_COLUMN_IDS,
  type TableColumnId,
} from "@/lib/table-query";

interface ColumnPickerProps {
  visibleColumns: TableColumnId[];
  onChange: (next: TableColumnId[]) => void;
}

export function ColumnPicker({ visibleColumns, onChange }: ColumnPickerProps) {
  function toggle(id: TableColumnId) {
    const next = visibleColumns.includes(id)
      ? visibleColumns.filter((c) => c !== id)
      : [...visibleColumns, id];
    onChange(next);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <Columns3 />
            Columns
          </Button>
        }
      />
      <PopoverContent align="end" className="w-56">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Visible columns
        </p>
        <div className="space-y-0.5">
          {TABLE_COLUMN_IDS.map((id) => (
            <label
              key={id}
              className="flex min-h-[36px] cursor-pointer items-center justify-between gap-3 rounded-md px-1.5 text-sm hover:bg-accent"
            >
              <span className="text-foreground">{COLUMN_LABELS[id]}</span>
              <Switch
                size="sm"
                checked={visibleColumns.includes(id)}
                onCheckedChange={() => toggle(id)}
              />
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { FORM_TYPE_LABELS, type FormType } from "@/lib/types";

export function FormTypeBadge({ formType }: { formType: FormType }) {
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {FORM_TYPE_LABELS[formType]}
    </Badge>
  );
}

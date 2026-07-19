"use client";

import { Car, Compass, Home, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FORM_TYPE_LABELS, type FormType } from "@/lib/types";

const FORM_TYPE_ICONS: Record<FormType, typeof Car> = {
  rental: Car,
  accommodation: Home,
  activity: Compass,
  transfer: Plane,
};

export function FormTypeBadge({ formType }: { formType: FormType }) {
  const Icon = FORM_TYPE_ICONS[formType];
  return (
    <Badge variant="secondary" className="gap-1 text-xs font-medium">
      <Icon className="size-3" strokeWidth={2} />
      {FORM_TYPE_LABELS[formType]}
    </Badge>
  );
}

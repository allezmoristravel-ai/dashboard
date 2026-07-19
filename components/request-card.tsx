"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { FormTypeBadge } from "@/components/form-type-badge";
import type { BookingRequest } from "@/lib/types";
import { useState } from "react";
import { DeclineDialog } from "@/components/decline-dialog";
import { SendPaymentDialog } from "@/components/send-payment-dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEUR(amount: number | null) {
  if (amount === null) return "—";
  return `EUR ${amount.toLocaleString()}`;
}

function formatPartySize(adults: number, children: number) {
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`];
  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  }
  return parts.join(", ");
}

export function RequestCard({ request }: { request: BookingRequest }) {
  const [declineOpen, setDeclineOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/15">
        <Link href={`/requests/${request.id}`} className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-muted-foreground">
                {request.reference}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {request.activityName}
            </h3>
            <FormTypeBadge formType={request.formType} />
          </CardHeader>
          <CardContent className="space-y-1.5 pb-2 text-sm">
            <p className="font-medium text-foreground">{request.fullName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatDate(request.startDate)}</span>
              <span aria-hidden className="text-border">
                &middot;
              </span>
              <span>{formatPartySize(request.adults, request.children)}</span>
            </div>
            {request.totalAmount !== null && (
              <div className="mt-2.5 flex items-center gap-2 border-t border-border/70 pt-2.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatEUR(request.totalAmount)}
                </span>
                {request.paid && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    Paid
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Link>

        <CardFooter className="flex flex-wrap gap-2 pt-2">
          {request.status === "pending_review" && (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setPaymentOpen(true);
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setDeclineOpen(true);
                }}
              >
                Decline
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <DeclineDialog
        requestId={request.id}
        open={declineOpen}
        onOpenChange={setDeclineOpen}
      />
      <SendPaymentDialog
        request={request}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </>
  );
}

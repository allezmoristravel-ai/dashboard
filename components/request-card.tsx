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
import { useRequests } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";
import { useState } from "react";
import { DeclineDialog } from "@/components/decline-dialog";
import { AmountsDialog } from "@/components/amounts-dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMUR(amount: number | null) {
  if (amount === null) return "—";
  return `MUR ${amount.toLocaleString()}`;
}

export function RequestCard({ request }: { request: BookingRequest }) {
  const { approveRequest, sendDepositLink, resendLink } = useRequests();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [amountsOpen, setAmountsOpen] = useState(false);

  const hasAmounts =
    request.depositAmount !== null &&
    request.balanceAmount !== null &&
    request.totalAmount !== null;

  return (
    <>
      <Card className="flex flex-col transition-shadow hover:shadow-md">
        <Link href={`/requests/${request.id}`} className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                {request.reference}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h3 className="text-base font-semibold leading-tight">
              {request.activityName}
            </h3>
          </CardHeader>
          <CardContent className="space-y-1 pb-2 text-sm">
            <p className="text-muted-foreground">{request.customerName}</p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{formatDate(request.requestedDate)}</span>
              <span>&middot;</span>
              <span>
                {request.partySize} {request.partySize === 1 ? "person" : "people"}
              </span>
            </div>
            {hasAmounts && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>
                  Total: <strong>{formatMUR(request.totalAmount)}</strong>
                </span>
                <span>
                  Deposit: {formatMUR(request.depositAmount)}
                  {request.depositPaid && (
                    <span className="ml-1 text-emerald-600">Paid</span>
                  )}
                </span>
                <span>
                  Balance: {formatMUR(request.balanceAmount)}
                  {request.balancePaid && (
                    <span className="ml-1 text-emerald-600">Paid</span>
                  )}
                </span>
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
                  approveRequest(request.id);
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

          {request.status === "approved" && !hasAmounts && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setAmountsOpen(true);
              }}
            >
              Set Amounts
            </Button>
          )}

          {request.status === "approved" && hasAmounts && (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  sendDepositLink(request.id);
                }}
              >
                Send Deposit Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  setAmountsOpen(true);
                }}
              >
                Edit Amounts
              </Button>
            </>
          )}

          {request.status === "awaiting_deposit" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                resendLink(request.id);
              }}
            >
              Resend Link
            </Button>
          )}
        </CardFooter>
      </Card>

      <DeclineDialog
        requestId={request.id}
        open={declineOpen}
        onOpenChange={setDeclineOpen}
      />
      <AmountsDialog
        request={request}
        open={amountsOpen}
        onOpenChange={setAmountsOpen}
      />
    </>
  );
}

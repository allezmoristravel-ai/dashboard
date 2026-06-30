"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { DevPaymentToggle } from "@/components/dev-payment-toggle";
import { DeclineDialog } from "@/components/decline-dialog";
import { AmountsDialog } from "@/components/amounts-dialog";
import { useRequests } from "@/lib/store";
import type { BookingRequest, RequestStatus } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMUR(amount: number | null) {
  if (amount === null) return "—";
  return `MUR ${amount.toLocaleString()}`;
}

const TIMELINE_STEPS: { status: RequestStatus; label: string }[] = [
  { status: "pending_review", label: "Request created" },
  { status: "approved", label: "Approved by owner" },
  { status: "awaiting_deposit", label: "Deposit link sent" },
  { status: "deposit_paid", label: "Deposit received" },
  { status: "awaiting_balance", label: "Balance link sent" },
  { status: "confirmed", label: "Fully paid & confirmed" },
  { status: "completed", label: "Activity completed" },
];

const STATUS_RANK: Record<RequestStatus, number> = {
  pending_review: 0,
  declined: 0,
  approved: 1,
  awaiting_deposit: 2,
  deposit_paid: 3,
  awaiting_balance: 4,
  confirmed: 5,
  reminded: 5,
  completed: 6,
  cancelled: 0,
};

export function RequestDetail({ request }: { request: BookingRequest }) {
  const {
    approveRequest,
    sendDepositLink,
    sendBalanceLink,
    resendLink,
    cancelRequest,
    markCompleted,
  } = useRequests();

  const [declineOpen, setDeclineOpen] = useState(false);
  const [amountsOpen, setAmountsOpen] = useState(false);

  const hasAmounts =
    request.depositAmount !== null &&
    request.balanceAmount !== null &&
    request.totalAmount !== null;

  const currentRank = STATUS_RANK[request.status];

  return (
    <>
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to inbox
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Request Information</CardTitle>
                <StatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{request.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium">{request.activityName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Date</p>
                  <p className="font-medium">{formatDate(request.requestedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party Size</p>
                  <p className="font-medium">
                    {request.partySize}{" "}
                    {request.partySize === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{request.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{request.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{request.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(request.createdAt)}</p>
                </div>
              </div>

              {request.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {request.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {hasAmounts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">
                      {formatMUR(request.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="text-xl font-bold">
                      {formatMUR(request.depositAmount)}
                    </p>
                    {request.depositPaid ? (
                      <span className="text-sm text-emerald-600">Paid</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-xl font-bold">
                      {formatMUR(request.balanceAmount)}
                    </p>
                    {request.balancePaid ? (
                      <span className="text-sm text-emerald-600">Paid</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.status === "pending_review" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => approveRequest(request.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setDeclineOpen(true)}
                  >
                    Decline
                  </Button>
                </>
              )}

              {request.status === "approved" && !hasAmounts && (
                <Button
                  className="w-full"
                  onClick={() => setAmountsOpen(true)}
                >
                  Set Amounts
                </Button>
              )}

              {request.status === "approved" && hasAmounts && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => sendDepositLink(request.id)}
                  >
                    Send Deposit Link
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setAmountsOpen(true)}
                  >
                    Edit Amounts
                  </Button>
                </>
              )}

              {request.status === "awaiting_deposit" && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => resendLink(request.id)}
                >
                  Resend Deposit Link
                </Button>
              )}

              {request.status === "deposit_paid" && (
                <Button
                  className="w-full"
                  onClick={() => sendBalanceLink(request.id)}
                >
                  Send Balance Link
                </Button>
              )}

              {(request.status === "awaiting_balance" ||
                request.status === "awaiting_deposit") && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => resendLink(request.id)}
                >
                  Resend Link
                </Button>
              )}

              {request.status === "confirmed" && (
                <Button
                  className="w-full"
                  onClick={() => markCompleted(request.id)}
                >
                  Mark Completed
                </Button>
              )}

              {![
                "declined",
                "cancelled",
                "completed",
              ].includes(request.status) && (
                <>
                  <Separator className="my-2" />
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => cancelRequest(request.id)}
                  >
                    Cancel Request
                  </Button>
                </>
              )}

              {["declined", "cancelled", "completed"].includes(
                request.status
              ) && (
                <p className="text-center text-sm text-muted-foreground">
                  No actions available.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {request.status === "declined" && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-3 w-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Request declined</p>
                  </div>
                </div>
              )}
              {request.status === "cancelled" && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-3 w-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Request cancelled</p>
                  </div>
                </div>
              )}
              {request.status !== "declined" &&
                request.status !== "cancelled" && (
                  <div className="space-y-4">
                    {TIMELINE_STEPS.map((step, i) => {
                      const stepRank = STATUS_RANK[step.status];
                      const done = stepRank <= currentRank;
                      return (
                        <div key={step.status} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 h-3 w-3 rounded-full ${
                              done
                                ? "bg-emerald-500"
                                : "border-2 border-muted-foreground/30 bg-transparent"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm ${
                                done
                                  ? "font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </CardContent>
          </Card>

          <DevPaymentToggle request={request} />
        </div>
      </div>

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

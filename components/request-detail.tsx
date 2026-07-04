"use client";

import { useEffect, useState } from "react";
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
import { FormTypeBadge } from "@/components/form-type-badge";
import { DeclineDialog } from "@/components/decline-dialog";
import { SendPaymentDialog } from "@/components/send-payment-dialog";
import { useRequests } from "@/lib/store";
import type { BookingRequest, DbPayment, RequestStatus } from "@/lib/types";

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
  { status: "awaiting_payment", label: "Approved — payment link sent" },
  { status: "confirmed", label: "Fully paid & confirmed" },
  { status: "completed", label: "Activity completed" },
];

const STATUS_RANK: Record<RequestStatus, number> = {
  pending_review: 0,
  declined: 0,
  approved: 0,
  awaiting_payment: 1,
  confirmed: 2,
  reminded: 2,
  completed: 3,
  cancelled: 0,
};

export function RequestDetail({ request }: { request: BookingRequest }) {
  const { cancelRequest, markCompleted, fetchPaymentForRequest } =
    useRequests();

  const [declineOpen, setDeclineOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<DbPayment | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentForRequest(request.id).then((p) => {
      if (!cancelled) setPayment(p);
    });
    return () => {
      cancelled = true;
    };
  }, [request.id, fetchPaymentForRequest]);

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
              <FormTypeBadge formType={request.formType} />
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
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(request.startDate)}</p>
                </div>
                {request.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(request.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Adults</p>
                  <p className="font-medium">{request.adults}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Children</p>
                  <p className="font-medium">{request.children}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{request.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{request.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{request.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(request.createdAt)}</p>
                </div>
              </div>

              {request.message && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {request.formType === "transfer" ? "Flight Details" : "Notes"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {request.message}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {request.totalAmount !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">
                      {formatMUR(request.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {request.paid ? (
                      <span className="text-sm font-medium text-emerald-600">
                        Paid
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {payment && (
                  <>
                    <Separator />
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      {payment.quickbooks_invoice_id && (
                        <p>QB Invoice #{payment.quickbooks_invoice_id}</p>
                      )}
                      {payment.quickbooks_payment_id && (
                        <p>QB Payment #{payment.quickbooks_payment_id}</p>
                      )}
                      {payment.pay_url && !payment.quickbooks_invoice_id && (
                        <p>Provider: {payment.provider}</p>
                      )}
                    </div>
                  </>
                )}
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
                    onClick={() => setPaymentOpen(true)}
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
                    {TIMELINE_STEPS.map((step) => {
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
        </div>
      </div>

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

"use client";

import { useState } from "react";
import { Check, MoreHorizontal, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeclineDialog } from "@/components/decline-dialog";
import { SendPaymentDialog } from "@/components/send-payment-dialog";
import { useRequests } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";

// Mirrors exactly the action set request-card.tsx / request-detail.tsx offer
// per status — same store handlers, same n8n webhook vs. direct-SDK-write
// split (lib/store.tsx). No action exists here that doesn't already exist
// there.
export function RowActionsMenu({ request }: { request: BookingRequest }) {
  const { cancelRequest, markCompleted, isActionPending } = useRequests();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const pending = isActionPending(request.id);
  const canCancel = !["declined", "cancelled", "completed"].includes(
    request.status
  );

  const hasActions =
    request.status === "pending_review" ||
    request.status === "confirmed" ||
    canCancel;

  if (!hasActions) {
    return <span className="sr-only">No actions available</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              aria-label="Row actions"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {request.status === "pending_review" && (
            <>
              <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
                <Check />
                Approve & send payment
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeclineOpen(true)}
              >
                <X />
                Decline
              </DropdownMenuItem>
            </>
          )}
          {request.status === "confirmed" && (
            <DropdownMenuItem onClick={() => markCompleted(request.id)}>
              <Check />
              Mark completed
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => cancelRequest(request.id)}
            >
              <XCircle />
              Cancel request
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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

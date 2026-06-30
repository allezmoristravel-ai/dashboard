"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRequests } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";

export function DevPaymentToggle({ request }: { request: BookingRequest }) {
  const { simulateDepositPayment, sendBalanceLink, simulateBalancePayment } =
    useRequests();

  return (
    <div className="space-y-4 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        Developer Controls (mock)
      </p>

      {request.status === "awaiting_deposit" && (
        <div className="flex items-center justify-between">
          <Label className="text-sm">Simulate deposit payment</Label>
          <Switch
            checked={request.depositPaid}
            onCheckedChange={() => simulateDepositPayment(request.id)}
            disabled={request.depositPaid}
          />
        </div>
      )}

      {request.status === "deposit_paid" && (
        <div className="space-y-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => sendBalanceLink(request.id)}
          >
            Send Balance Link
          </Button>
        </div>
      )}

      {request.status === "awaiting_balance" && (
        <div className="flex items-center justify-between">
          <Label className="text-sm">Simulate balance payment</Label>
          <Switch
            checked={request.balancePaid}
            onCheckedChange={() => simulateBalancePayment(request.id)}
            disabled={request.balancePaid}
          />
        </div>
      )}

      {![
        "awaiting_deposit",
        "deposit_paid",
        "awaiting_balance",
      ].includes(request.status) && (
        <p className="text-sm text-muted-foreground">
          No payment simulations available for this status.
        </p>
      )}
    </div>
  );
}

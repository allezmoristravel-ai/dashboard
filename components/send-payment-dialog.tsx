"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequests, validateTotalAmount } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";

interface SendPaymentDialogProps {
  request: BookingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendPaymentDialog({
  request,
  open,
  onOpenChange,
}: SendPaymentDialogProps) {
  const { sendPayment, isActionPending } = useRequests();
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTotal(request.totalAmount ?? 0);
      setError(null);
    }
  }, [open, request.totalAmount]);

  const pending = isActionPending(request.id);

  async function handleConfirm() {
    const validation = validateTotalAmount(total);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid amount");
      return;
    }
    await sendPayment(request.id, total);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve & Send Payment</DialogTitle>
          <DialogDescription>
            {request.reference} — {request.activityName}. Confirm the total
            price — the customer will get a payment link by email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="total">Total Amount (MUR)</Label>
            <Input
              id="total"
              type="number"
              min={1}
              value={total}
              onChange={(e) => {
                setTotal(Number(e.target.value));
                setError(null);
              }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending ? "Sending…" : "Approve & Send Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

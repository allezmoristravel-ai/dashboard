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
import { useRequests } from "@/lib/store";
import { validateAmounts } from "@/lib/store";
import { DEFAULT_AMOUNTS, type BookingRequest } from "@/lib/types";

interface AmountsDialogProps {
  request: BookingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AmountsDialog({
  request,
  open,
  onOpenChange,
}: AmountsDialogProps) {
  const { setAmounts } = useRequests();
  const [total, setTotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTotal(request.totalAmount ?? DEFAULT_AMOUNTS.total);
      setDeposit(request.depositAmount ?? DEFAULT_AMOUNTS.deposit);
      setError(null);
    }
  }, [open, request.totalAmount, request.depositAmount]);

  const balance = total - deposit;

  function handleSave() {
    const validation = validateAmounts(deposit, balance, total);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid amounts");
      return;
    }
    setAmounts(request.id, { deposit, balance, total });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Amounts</DialogTitle>
          <DialogDescription>
            {request.reference} — {request.activityName}
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
          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit Amount (MUR)</Label>
            <Input
              id="deposit"
              type="number"
              min={1}
              value={deposit}
              onChange={(e) => {
                setDeposit(Number(e.target.value));
                setError(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Balance (auto-calculated)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              disabled
              className="bg-muted"
            />
          </div>
          {deposit > total && (
            <p className="text-sm text-destructive">
              Deposit cannot exceed total
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Amounts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

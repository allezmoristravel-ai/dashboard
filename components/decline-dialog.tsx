"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRequests } from "@/lib/store";

interface DeclineDialogProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeclineDialog({
  requestId,
  open,
  onOpenChange,
}: DeclineDialogProps) {
  const { declineRequest } = useRequests();
  const [note, setNote] = useState("");

  function handleConfirm() {
    declineRequest(requestId, note || undefined);
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to decline this request?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="decline-note">Note (optional)</Label>
          <Textarea
            id="decline-note"
            placeholder="Reason for declining..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

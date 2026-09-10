"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Reached via the link Supabase emails from resetPasswordForEmail. The email
// template points here with a raw token_hash (not Supabase's own auto-
// consuming /auth/v1/verify URL) so that link scanners, click-tracking bots,
// etc. hitting this page's HTML can't silently burn the one-time token —
// only an explicit "Confirm" click below calls verifyOtp and consumes it.
function ResetPasswordContent() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const paramType = searchParams.get("type");

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const confirmLink = async () => {
    if (!tokenHash) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const { error } = await getSupabase().auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (error) throw error;
      setConfirmed(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setConfirmError(message);
    } finally {
      setConfirming(false);
    }
  };

  const setNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password set — you're signed in");
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not set password: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Ready to set a password once verifyOtp has succeeded, or (backward
  // compatibility with an unmodified email template) if a recovery session
  // already exists via Supabase's automatic hash-fragment handling.
  const readyForPassword = confirmed || !!session;
  const hasValidLink = tokenHash && paramType === "recovery";

  let body: React.ReactNode;
  if (authLoading) {
    body = (
      <div className="flex justify-center py-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  } else if (readyForPassword) {
    body = (
      <form onSubmit={setNewPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="animate-spin" />}
          Save password
        </Button>
      </form>
    );
  } else if (hasValidLink) {
    body = (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Confirm you followed this link on purpose to continue.
        </p>
        {confirmError && (
          <p className="text-sm text-destructive">
            This link is invalid or has expired: {confirmError}
          </p>
        )}
        <Button
          type="button"
          disabled={confirming}
          className="w-full"
          onClick={confirmLink}
        >
          {confirming && <Loader2 className="animate-spin" />}
          Confirm & continue
        </Button>
        {confirmError && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.replace("/login")}
          >
            Back to sign in
          </Button>
        )}
      </div>
    );
  } else {
    body = (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => router.replace("/login")}
      >
        Back to sign in
      </Button>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            {authLoading
              ? "Checking your link…"
              : readyForPassword
                ? "Choose a password for the dashboard."
                : hasValidLink
                  ? "One more step before you can set a password."
                  : "This link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

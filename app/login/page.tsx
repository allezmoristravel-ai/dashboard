"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
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

// Only one account exists for this dashboard (created ahead of time in the
// Supabase project — public signups are disabled). Password login is used
// day to day; the "email me a link" flow below both proves ownership of the
// inbox and is how that account's password gets set in the first place.

type Mode = "signin" | "linkSent";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    setSubmitting(true);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) throw error;
      // AuthGate picks up the new session via onAuthStateChange and redirects.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not sign in: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const sendPasswordLink = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Enter your email first");
      return;
    }

    setSendingLink(true);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (error) throw error;
      setMode("linkSent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not send the link: ${message}`);
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2.5">
            <Image
              src="/allez-moris-logo.png"
              alt="Allez Moris"
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-lg"
              priority
            />
            <div className="leading-tight">
              <CardTitle>Allez Moris</CardTitle>
              <CardDescription>Owner Dashboard</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <form onSubmit={signIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
              <button
                type="button"
                onClick={sendPasswordLink}
                disabled={sendingLink}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {sendingLink ? "Sending…" : "First time here, or forgot your password?"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <MailCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  If <strong className="font-medium text-foreground">{email}</strong> is
                  the dashboard&apos;s account, we&apos;ve sent a link to set (or reset) its
                  password. Open it on this device to continue.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

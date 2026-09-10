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

type Step = "email" | "code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setSubmitting(true);
    try {
      // shouldCreateUser: false — this dashboard is for pre-authorized owner
      // accounts only, not open self-signup. Create accounts in the Supabase
      // dashboard (Authentication → Users) ahead of time.
      const { error } = await getSupabase().auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep("code");
      toast.success("Check your email for a verification code");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not send verification code: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setSubmitting(true);
    try {
      const { error } = await getSupabase().auth.verifyOtp({
        email: email.trim(),
        token: trimmedCode,
        type: "email",
      });
      if (error) throw error;
      // AuthGate picks up the new session via onAuthStateChange and redirects.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Invalid or expired code: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setSubmitting(true);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast.success("New code sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not resend code: ${message}`);
    } finally {
      setSubmitting(false);
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
          {step === "email" ? (
            <form onSubmit={sendCode} className="flex flex-col gap-4">
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
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="animate-spin" />}
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="flex flex-col gap-4">
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <MailCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  We sent a 6-digit code to <strong className="font-medium text-foreground">{email}</strong>.
                  Enter it below to confirm it&apos;s you.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="animate-spin" />}
                Verify & sign in
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={submitting}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

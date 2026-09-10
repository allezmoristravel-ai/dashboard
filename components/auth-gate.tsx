"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  // /reset-password is reached via the emailed link, which itself establishes
  // a (recovery) session — it must render regardless of session state instead
  // of being redirected away like a normal authenticated page.
  const isResetPasswordPage = pathname === "/reset-password";
  const isPublicPage = isLoginPage || isResetPasswordPage;

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublicPage) {
      router.replace("/login");
    } else if (session && isLoginPage) {
      router.replace("/");
    }
  }, [session, loading, isPublicPage, isLoginPage, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirecting — render nothing to avoid a flash of the wrong screen.
  if ((!session && !isPublicPage) || (session && isLoginPage)) return null;

  return <>{children}</>;
}

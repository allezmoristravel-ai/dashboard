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

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginPage) {
      router.replace("/login");
    } else if (session && isLoginPage) {
      router.replace("/");
    }
  }, [session, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirecting — render nothing to avoid a flash of the wrong screen.
  if ((!session && !isLoginPage) || (session && isLoginPage)) return null;

  return <>{children}</>;
}

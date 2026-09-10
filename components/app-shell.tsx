"use client";

import { usePathname } from "next/navigation";
import { RequestProvider } from "@/lib/store";
import { Header } from "@/components/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <RequestProvider>
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6">{children}</main>
    </RequestProvider>
  );
}

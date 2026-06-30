"use client";

import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <>
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Booking Manager</h1>
          <span className="text-sm text-muted-foreground">Owner Dashboard</span>
        </div>
      </header>
      <Separator />
    </>
  );
}

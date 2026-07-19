"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inbox" },
  { href: "/calendar", label: "Calendar" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/allez-moris-logo.png"
            alt="Allez Moris"
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg"
            priority
          />
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
              Allez Moris
            </h1>
            <p className="text-xs text-muted-foreground">Owner Dashboard</p>
          </div>

          <nav className="ml-4 flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-2 pr-2.5 text-xs font-medium text-secondary-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>
    </header>
  );
}

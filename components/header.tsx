"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inbox" },
  { href: "/calendar", label: "Calendar" },
  { href: "/table", label: "Table" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="container mx-auto flex items-center gap-2.5 px-4 py-3.5 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/allez-moris-logo.png"
            alt="Allez Moris"
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg"
            priority
          />
          <div className="hidden leading-tight sm:block">
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
              Allez Moris
            </h1>
            <p className="text-xs text-muted-foreground">Owner Dashboard</p>
          </div>
        </div>

        {/* min-w-0 + overflow-x-auto: with three nav items this can outgrow
            very narrow phone widths, so it scrolls locally instead of
            forcing the whole header (and page) to overflow horizontally. */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
                  "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
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

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-2 pr-2.5 text-xs font-medium text-secondary-foreground">
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

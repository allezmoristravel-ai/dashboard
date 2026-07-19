"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "ios-install-hint-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari-specific flag; not in the standard Navigator type.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (isIos() && !isStandalone()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-30 flex items-center justify-center gap-2 border-t border-border bg-card/95 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-sm"
      role="status"
    >
      <Share className="size-3.5 shrink-0" />
      <span>
        Install this app: tap Share, then <strong className="font-medium text-foreground">Add to Home Screen</strong>.
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "1");
          setVisible(false);
        }}
      >
        <X />
      </Button>
    </div>
  );
}

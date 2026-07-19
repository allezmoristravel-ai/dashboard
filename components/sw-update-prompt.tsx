"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SwUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    const handleUpdateFound = (reg: ServiceWorkerRegistration) => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(installing);
        }
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
      }
      reg.addEventListener("updatefound", () => handleUpdateFound(reg));
    });

    let reloaded = false;
    const handleControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!waitingWorker) return null;

  return (
    <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-30 flex items-center justify-center gap-3 border-b border-border bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
      <span>A new version is available.</span>
      <Button
        variant="secondary"
        size="xs"
        onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}
      >
        <RefreshCw className="size-3" />
        Reload
      </Button>
    </div>
  );
}

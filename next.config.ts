import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  // @ducanh2912/next-pwa always injects a webpack() hook (even when
  // disabled), which Next 16's Turbopack default flags as a mismatch.
  // The production build runs with `next build --webpack` so the PWA
  // plugin's workbox precache actually runs; this just silences the
  // coexistence warning for `next dev`, which stays on Turbopack.
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Let a new service worker sit in the "waiting" state instead of
    // auto-activating, so SwUpdatePrompt can ask before swapping the shell.
    skipWaiting: false,
    // Booking requests and payment statuses must always come from the
    // network — a cached Supabase response is worse than no PWA at all.
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
        handler: "NetworkOnly",
      },
    ],
  },
});

export default withPWA(nextConfig);

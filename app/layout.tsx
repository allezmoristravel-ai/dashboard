import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { IosInstallHint } from "@/components/ios-install-hint";
import { SwUpdatePrompt } from "@/components/sw-update-prompt";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Booking Manager",
  description: "Owner dashboard for managing tourism booking requests",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Allez Moris",
  },
};

export const viewport: Viewport = {
  themeColor: "#b13c11",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="pb-[env(safe-area-inset-bottom)]">
        <AuthProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
          <Toaster richColors />
          <IosInstallHint />
          <SwUpdatePrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { RequestProvider } from "@/lib/store";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Booking Manager",
  description: "Owner dashboard for managing tourism booking requests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <RequestProvider>
          <Header />
          <main className="container mx-auto px-4 py-6">{children}</main>
          <Toaster richColors />
        </RequestProvider>
      </body>
    </html>
  );
}

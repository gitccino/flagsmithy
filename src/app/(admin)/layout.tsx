import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, Settings, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagProvider } from "@/components/flag-provider";
import { evaluateFlag } from "@/lib/evaluation/engine";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flagsmithy Admin",
  description: "Manage your feature flags premium experience",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialFlags = {
    "new-user-onboarding":
      (await evaluateFlag("new-user-onboarding", "user_123")) ?? false,
  };

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-white">
        <FlagProvider initialFlags={initialFlags}>
          <aside className="w-64 border-r bg-background flex-col hidden md:flex">
            <nav className="flex-1 p-4 space-y-1">
              <Button variant="none" size="lg" asChild>
                <Link
                  href="/"
                  className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2 "
                >
                  {/* <LayoutDashboard size={18} /> */}
                  Dashboard
                </Link>
              </Button>
              <Button variant="none" size="lg" asChild>
                <Link
                  href="/flags/new"
                  className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2 "
                >
                  {/* <PlusCircle size={18} /> */}+ New Flag
                </Link>
              </Button>
            </nav>
            <div className="p-4 border-t border-[#26292D]">
              <Button variant="none" size="lg" asChild>
                <Link
                  href="#"
                  className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2"
                >
                  <Settings size={18} />
                  Settings
                </Link>
              </Button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-h-screen">
            <header className="h-8 border-b bg-background backdrop-blur-md flex items-center px-8 sticky top-0 z-10">
              <div className="flex-1">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                  Admin Dashboard
                </span>
              </div>
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </FlagProvider>
      </body>
    </html>
  );
}

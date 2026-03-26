import type { Metadata } from 'next'
import { Geist, Geist_Mono, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { CircleCheck, CircleX, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlagProvider } from '@/components/flag-provider'
import { evaluateFlag } from '@/lib/evaluation/engine'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Flagsmithy Admin',
  description: 'Manage your feature flags premium experience',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialFlags = {
    'new-user-onboarding':
      (await evaluateFlag('new-user-onboarding', 'user_123')) ?? false,
  }

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-white">
        <Toaster
          icons={{
            success: (
              <CircleCheck fill="#03E072" color="var(--flag-card-background)" />
            ),
            error: (
              <CircleX
                fill="var(--destructive)"
                color="var(--flag-card-background)"
              />
            ),
          }}
          toastOptions={{
            style: {
              background: 'var(--flag-card-background)',
              width: 'fit-content',
              minWidth: '200px',
              gap: '0.8rem',
            },
          }}
        />
        <SidebarProvider defaultOpen={false}>
          <FlagProvider initialFlags={initialFlags}>
            {/*<aside className="w-48 border-r bg-background flex-col hidden md:block">
              <nav className="flex-1 p-4 space-y-1">
                <Button variant="none" size="lg" asChild>
                  <Link
                    href="/"
                    className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2 "
                  >
                    Dashboard
                  </Link>
                </Button>
                <Button variant="none" size="lg" asChild>
                  <Link
                    href="/flags/new"
                    className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2 "
                  >
                    + New Flag
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
            </aside>*/}

            <Sidebar>
              {/*<SidebarHeader />*/}
              <SidebarContent className="bg-background">
                <SidebarGroup>
                  <Button variant="none" size="lg" asChild>
                    <Link
                      href="/"
                      className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background"
                    >
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="none" size="lg" asChild>
                    <Link
                      href="/segments"
                      className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background"
                    >
                      Segments
                    </Link>
                  </Button>
                  {/*<Button variant="none" size="lg" asChild>
                    <Link
                      href="#"
                      className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background-lv2"
                    >
                      <Settings size={18} />
                      Settings
                    </Link>
                  </Button>*/}
                </SidebarGroup>
                <SidebarGroup />
              </SidebarContent>
              <SidebarFooter />
            </Sidebar>
            <div className="flex-1 flex flex-col min-h-screen">
              <header className="h-8 border-b bg-background backdrop-blur-md flex items-center px-8 sticky top-0 z-10">
                <div className="flex-1 flex items-center">
                  {/*<span className="text-xs text-muted-foreground uppercase tracking-widest">
                    Admin
                  </span>*/}
                  <div>
                    <Button variant="link" asChild>
                      <Link href="/">Dashboard</Link>
                    </Button>
                    <Button variant="link" asChild>
                      <Link href="/segments">Segments</Link>
                    </Button>
                  </div>
                </div>
              </header>
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </FlagProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}

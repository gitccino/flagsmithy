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
import { auth, UserSession } from '@/lib/auth'
import { headers } from 'next/headers'
import { SignOutButton } from '@/components/sign-out-button'
import ProfileMenu from '@/components/nav/profile-menu'
import { redirect } from 'next/navigation'

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
  const [initialFlags, session] = await Promise.all([
    evaluateFlag({ flagKey: 'new-user-onboarding' }).then((v) => ({
      'new-user-onboarding': v ?? false,
    })),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-foreground">
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
            <Sidebar>
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
                  <Button variant="none" size="lg" asChild>
                    <Link
                      href="/settings"
                      className="w-full flex justify-start items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-flag-card-background"
                    >
                      <Settings size={18} />
                      Settings
                    </Link>
                  </Button>
                </SidebarGroup>
                <SidebarGroup />
              </SidebarContent>
              <SidebarFooter className="bg-background border-t border-border px-4 py-3">
                {session?.user && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <SignOutButton />
                  </div>
                )}
              </SidebarFooter>
            </Sidebar>

            <div className="flex-1 flex flex-col min-h-screen">
              <header className="max-w-6xl mx-auto w-full py-1 border-b-0 bg-background backdrop-blur-md flex items-center px-2 sticky top-0 z-10">
                <div className="flex-1 flex items-center">
                  <div>
                    <Button variant="link" asChild>
                      <Link href="/">Dashboard</Link>
                    </Button>
                    <Button variant="link" asChild>
                      <Link href="/segments">Segments</Link>
                    </Button>
                    {/*<Button variant="link" asChild>
                      <Link href="/settings">Settings</Link>
                    </Button>*/}
                  </div>
                  <div className="ml-auto">
                    <ProfileMenu user={session.user} />
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

import type { Metadata } from 'next'
import { Geist, Geist_Mono, Source_Code_Pro } from 'next/font/google'
import '../(admin)/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Flagsmithy',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex items-center justify-center bg-background text-white">
        <div className="w-full max-w-sm px-4">{children}</div>
      </body>
    </html>
  )
}

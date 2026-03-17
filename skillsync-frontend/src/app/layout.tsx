import type { Metadata } from 'next'
// Removed remote Google font import to avoid build-time network errors
// Fonts can be loaded via CSS or system defaults instead.
import './globals.css'
import { Providers } from './providers'
import { DemoBookingModal } from "@/components/marketing/DemoBookingModal"

// If you want a custom font, consider using `next/font/local` or
// importing via CSS so the build doesn't need to fetch from Google.
// const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-inter',
//   display: 'swap',
// })

export const metadata: Metadata = {
  title: 'SkillSync - AI-Powered Talent Alignment Platform',
  description: 'Connecting students, employers, and universities in Sri Lanka\'s tech sector through AI-driven skill matching and analytics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <DemoBookingModal />
        </Providers>
      </body>
    </html>
  )
}

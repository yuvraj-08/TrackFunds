import type { Metadata } from 'next'
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
})

export const metadata: Metadata = {
  title: 'TrackFunds Starter',
  description: 'A reusable Next.js monorepo starter for building finance and product apps.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TickrTime',
  description: 'Never miss earnings again - Real-time tech stock earnings dashboard with comprehensive data and insights',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

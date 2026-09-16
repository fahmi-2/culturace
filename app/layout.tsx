import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CULTURACE — Pasuruan Red Edition',
  description: 'Fun run heritage yang membawa langkahmu melintasi budaya dan landmark merah Pasuruan.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#a91024',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}

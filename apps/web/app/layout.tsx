import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../css/globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const title = {
  template: '%s | GridTip',
  default: 'GridTip – F1 Tipping',
}
const description =
  'Guess the outcome of the Formula One season with your friends. Predict the outcome of the Grand Prix weekends, and the championships. Have fun and find out who claims the tipping podium!'

export const metadata: Metadata = {
  metadataBase: new URL(must(process.env.BETTER_AUTH_URL)),
  title,
  description,
  openGraph: {
    title,
    siteName: 'GridTip',
    description,
    type: 'website',
    locale: 'en_AU',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster richColors />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

function must(value: string | undefined) {
  if (!value) {
    throw new Error('Missing env var')
  }
  return value
}

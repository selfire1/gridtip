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

export const metadata: Metadata = {
  title: {
    template: '%s | GridTip',
    default: 'GridTip – F1 Tipping',
  },
  description:
    'Guess the outcome of the Formula One season with your friends. Predict the outcome of the Grand Prix weekends, and the championships. Have fun and find out who claims the tipping podium!',
  openGraph: {
    title: {
      template: '%s | GridTip',
      default: 'GridTip – F1 Tipping',
    },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased mb-24`}
      >
        <Toaster richColors />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

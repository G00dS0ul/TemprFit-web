import './theme.css'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { noFlashScript } from '@/components/ThemeProvider/no-flash-script'
import ChromeShell from '@/components/ChromeShell'
import { ToastProvider } from '@/components/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  title: 'TemprFit — Your Body. Your Goals. Your AI Coach.',
  description:
    'TemprFit is an AI-powered fitness ecosystem: personalized training, an always-on AI coach, progress tracking, nutrition, and a trainer marketplace.',
  keywords: 'gym, fitness, workout, AI coach, trainer, nutrition, tracker, TemprFit',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TemprFit',
  },
  icons: {
    icon: '/images/brand/my-logo.png',
    apple: '/images/brand/my-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <ChromeShell>{children}</ChromeShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

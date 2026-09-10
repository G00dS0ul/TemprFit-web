import './theme.css'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { noFlashScript } from '@/components/ThemeProvider/no-flash-script'
import Navbar from '@/components/Navbar'
import ChromeShell from '@/components/ChromeShell'
import MobileBottomNav from '@/components/MobileBottomNav'
import FloatingSearch from '@/components/FloatingSearch'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'TemprFit — Your Body. Your Goals. Your AI Coach.',
  description:
    'TemprFit is an AI-powered fitness ecosystem: personalized training, an always-on AI coach, progress tracking, nutrition, and a trainer marketplace.',
  keywords: 'gym, fitness, workout, AI coach, trainer, nutrition, tracker, TemprFit',
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
          <Navbar />
          <main>
            <ChromeShell>{children}</ChromeShell>
          </main>
          <MobileBottomNav />
          <FloatingSearch />
        </ThemeProvider>
      </body>
    </html>
  )
}

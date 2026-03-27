import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono, Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/providers'
import './globals.css'

const dmSans = DM_Sans({ 
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Araucaria Sistema - Almacenes',
  description: 'Sistema de gestión de inventario para almacenes y obras de construcción',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/araucaria1.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/araucaria1.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/araucaria1.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
        <AppProviders>
          {children}
          <Analytics />
        </AppProviders>
      </body>
    </html>
  )
}

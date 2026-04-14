import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import '../styles/tailwind.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import HydrationHandler from '@/components/HydrationHandler'

// Auto-start background tasks when the server starts
import '@/lib/auto-start-background-tasks'

const inter = Inter({ subsets: ['latin'] })
const ibmPlexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'] })

export const metadata = {
  title: {
    template: '%s | Nesbah',
    default: 'Nesbah — POS & Business Financing Marketplace in Saudi Arabia',
  },
  description:
    'Compare POS financing, business loans, and working capital offers from top Saudi banks. Free to use. Submit one request, receive multiple offers.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nesbah.com.sa'),
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'Nesbah',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nesbah_sa',
  },
  // After GSC verification: uncomment and add your code
  // verification: { google: 'YOUR_VERIFICATION_CODE' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="ltr">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Prevent flash by hiding content until React hydrates */
              body {
                opacity: 0;
                transition: opacity 0.1s ease-in;
              }
              body.hydrated {
                opacity: 1;
              }
              
              /* FORCE MODERN FONTS - OVERRIDE ALL EXISTING STYLES */
              :root {
                --font-sans: 'IBM Plex Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              }

              /* Base font + rendering */
              *, *::before, *::after {
                font-family: var(--font-sans) !important;
                text-rendering: optimizeLegibility !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${ibmPlexArabic.className} text-gray-950 antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
        <HydrationHandler />
      </body>
    </html>
  )
}

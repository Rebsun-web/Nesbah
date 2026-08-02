import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import Script from 'next/script'
import '../styles/tailwind.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import HydrationHandler from '@/components/HydrationHandler'

// Auto-start background tasks when the server starts
import '@/lib/auto-start-background-tasks'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
})

export const metadata = {
  title: {
    template: '%s | نسبة',
    default: 'نسبة | تمويل الشركات في السعودية',
  },
  description:
    'قدّم طلب تمويل واحد واحصل على عروض من بنوك وشركات تمويل مرخصة في السعودية. نسبة منصة مجانية تساعد الشركات في مقارنة عروض التمويل واختيار الأنسب.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nesbah.com.sa'),
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'نسبة',
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
    <html lang="ar" dir="rtl" className={`${inter.variable} ${ibmPlexArabic.variable}`}>
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
              
              /* Reference the next/font-generated family names, not the literal
                 'IBM Plex Sans Arabic' — next/font registers the face under a
                 hashed name, so the literal never matched and Arabic silently
                 fell back to the system font. Its taller vertical metrics made
                 the hero headline's lines collide at leading-[1.05]. */
              :root {
                --font-sans: var(--font-plex-arabic), var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              }

              /* Set on body, not `*`: a universal !important font-family also
                 overrode Tailwind's font-display utility, so the display face
                 could never apply. Descendants inherit from body instead. */
              body {
                font-family: var(--font-sans) !important;
              }

              *, *::before, *::after {
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            `,
          }}
        />
      </head>
      <body className="font-sans text-gray-950 antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
        <HydrationHandler />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-ZQK27MRML9" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-ZQK27MRML9');
        `}</Script>
      </body>
    </html>
  )
}

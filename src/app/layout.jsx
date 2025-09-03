import { Inter } from 'next/font/google'
import '../styles/tailwind.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import HydrationHandler from '@/components/HydrationHandler'

// Background tasks are now started manually via API endpoint
// This prevents server startup delays

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    template: '%s - Nesbah',
    default: 'Nesbah - Grow your business with us',
  },
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
                --font-sans: 'Inter', 'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              }
              
              /* Force modern font on ALL elements */
              *, *::before, *::after {
                font-family: var(--font-sans) !important;
                font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1 !important;
                text-rendering: optimizeLegibility !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
              
              /* Force Arabic text to use Almarai - OVERRIDE EVERYTHING */
              [lang="ar"], [lang="ar"] *, .arabic, .arabic * {
                font-family: 'Almarai', 'Inter', var(--font-sans) !important;
                line-height: 1.5 !important;
                letter-spacing: -0.025em !important;
                font-weight: 400 !important;
                font-style: normal !important;
                font-variant: normal !important;
                text-transform: none !important;
              }
              
              /* Force English text to use Inter */
              [lang="en"], [lang="en"] *, .english, .english * {
                font-family: 'Inter', 'Almarai', var(--font-sans) !important;
                line-height: 1.5 !important;
                letter-spacing: -0.025em !important;
              }
              
              /* Force all headings to use modern fonts */
              h1, h2, h3, h4, h5, h6, h1 *, h2 *, h3 *, h4 *, h5 *, h6 * {
                font-family: 'Inter', 'Almarai', var(--font-sans) !important;
                font-weight: 600 !important;
                line-height: 1.2 !important;
              }
              
              /* Force all form elements to use modern fonts */
              button, input, textarea, select, button *, input *, textarea *, select * {
                font-family: 'Inter', 'Almarai', var(--font-sans) !important;
                font-weight: 500 !important;
              }
              
              /* Force all text elements */
              p, p *, span, span *, div, div * {
                font-family: 'Inter', 'Almarai', var(--font-sans) !important;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} text-gray-950 antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
        <HydrationHandler />
      </body>
    </html>
  )
}

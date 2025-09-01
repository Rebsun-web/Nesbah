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
    <html lang="ar" dir="rtl">
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
            `,
          }}
        />
      </head>
      <body className="text-gray-950 antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
        <HydrationHandler />
      </body>
    </html>
  )
}

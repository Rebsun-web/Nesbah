import '@/styles/tailwind.css'
import '@/lib/server-init.js'
import connectionManager from '@/lib/connection-manager'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'

export const metadata = {
  title: {
    template: '%s - Nesbah',
    default: 'Nesbah - Grow your business with us',
  },
}

export default function RootLayout({ children }) {
  // Initialize connection manager on client side
  if (typeof window !== 'undefined') {
    connectionManager.init();
  }

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="The Radiant Blog"
          href="/blog/feed.xml"
        />
      </head>
      <body className="text-gray-950 antialiased">
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  )
}

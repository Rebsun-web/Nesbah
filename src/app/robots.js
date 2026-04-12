export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nesbah.com.sa'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/portal/', '/bankPortal/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}

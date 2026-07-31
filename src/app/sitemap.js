export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nesbah.com.sa'

  const routes = [
    '',
    '/about',
    '/business-financing',
    '/contact',
    '/equipment-financing',
    '/expansion-financing',
    '/onboarding',
    '/pos-financing',
    '/privacy',
    '/project-financing',
    '/real-estate-project-financing',
    '/terms',
    '/working-capital-financing',
  ]

  // /deposits is reverse-proxied from nesbah.net (see next.config.mjs). Until the
  // nesbah.net side flips VITE_SITE_URL to https://nesbah.com.sa, the proxied page
  // still emits <link rel="canonical" href="https://nesbah.net/deposits">, so
  // listing our URL here would submit a page that canonicalises to another domain.
  // Set DEPOSITS_IN_SITEMAP=true only after they confirm the flip is live.
  if (process.env.DEPOSITS_IN_SITEMAP === 'true') {
    routes.push('/deposits')
  }

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    // Deposit rates change weekly; everything else is stable marketing content.
    changeFrequency: route === '' || route === '/deposits' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}

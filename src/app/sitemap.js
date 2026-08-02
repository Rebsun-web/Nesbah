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

  // /deposits and /financing-guide are reverse-proxied from nesbah.net (see
  // next.config.mjs). The origin now emits canonicals pointing at nesbah.com.sa
  // (verified 2026-08-02), so these are safe to submit as our own URLs.
  routes.push('/deposits', '/financing-guide')

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    // Deposit rates change weekly; everything else is stable marketing content.
    changeFrequency: route === '' || route === '/deposits' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}

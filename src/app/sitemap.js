export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nesbah.com.sa'

  const routes = [
    '',
    '/about',
    '/business-financing',
    '/contact',
    '/equipment-financing',
    '/expansion-financing',
    '/knowledge',
    '/onboarding',
    '/pos-financing',
    '/privacy',
    '/project-financing',
    '/real-estate-project-financing',
    '/terms',
    '/working-capital-financing',
  ]

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}

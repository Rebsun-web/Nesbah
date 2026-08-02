/** @type {import('next').NextConfig} */

// The deposits comparison tool and the financing guide live in a separate codebase
// (nesbah.net) so that rate corrections ship in minutes without a main-site
// deployment. Rebuilding or duplicating them here is explicitly out of scope —
// instead we reverse-proxy them so they are served from a nesbah.com.sa URL for
// users and search engines while the code stays where it is. This consolidates
// ranking authority and the .com.sa geo signal on one domain.
//
// Set DEPOSITS_PROXY_ENABLED=false to disable the proxy without a code change
// (the documented fallback is a deposits.nesbah.com.sa CNAME instead).
const DEPOSITS_ORIGIN = process.env.DEPOSITS_ORIGIN || 'https://nesbah.net'
const DEPOSITS_PROXY_ENABLED = process.env.DEPOSITS_PROXY_ENABLED !== 'false'

// Paths the proxied app requests from the browser at ROOT-relative URLs. Served
// from nesbah.com.sa these would hit this app and 404, producing an unstyled or
// blank page. Verified against the live HTML of https://nesbah.net/deposits.
//
// Collision check against this app: Next serves its own bundles under /_next/*,
// public/ contains no `assets`, `logos` or `__l5e` directory, and there is no /en
// route — so none of these shadow an existing nesbah.com.sa path.
//
// Deliberately NOT proxied: /favicon.ico. The proxied HTML references it, and this
// site should serve its own — see public/favicon.ico and src/app/icon.png, both
// generated from the Nesbah logo mark. (Before those existed the request 404'd
// site-wide, not just on /deposits.)
const depositsRewrites = [
  // ASSETS ONLY. The HTML documents are served by route handlers instead
  // (src/app/deposits/…, src/app/financing-guide/…) so we can inject a navigation
  // guard — see the long comment in src/lib/deposits-proxy.js for why a blind
  // rewrite is not enough for a single-page app.
  //
  // Collision check against this app: Next serves its own bundles under /_next/*,
  // public/ contains no `assets`, `logos` or `__l5e` directory, and no route of ours
  // starts with any of these prefixes.

  // Vite/TanStack build output and Lovable's asset CDN path.
  { source: '/assets/:path*', destination: `${DEPOSITS_ORIGIN}/assets/:path*` },
  { source: '/__l5e/:path*', destination: `${DEPOSITS_ORIGIN}/__l5e/:path*` },

  // Bank logos rendered in the comparison table, and the OG image.
  // NOTE: the spec's example rewrite says /og-default.png — the live asset is .svg.
  { source: '/logos/:path*', destination: `${DEPOSITS_ORIGIN}/logos/:path*` },
  { source: '/og-default.svg', destination: `${DEPOSITS_ORIGIN}/og-default.svg` },

  // TanStack Start server functions. The deposit request form POSTs here, and this
  // path sits OUTSIDE /deposits — without this rule the page renders perfectly and
  // the form silently fails. Only the public deposits functions are
  // unauthenticated; the admin/partner ones are Supabase-guarded and their auth
  // cookies are scoped to nesbah.net, so they cannot be reached through here.
  { source: '/_serverFn/:path*', destination: `${DEPOSITS_ORIGIN}/_serverFn/:path*` },
]

// The proxied pages' own chrome links to routes that exist on nesbah.net but not
// here: /apply and /en/apply (their application form) and /en (their English
// homepage). Left alone those 404 on our domain — the "Apply" button on the
// proxied 404 page is exactly how this surfaces.
//
// These are REDIRECTS, not rewrites: we want the visitor on OUR equivalent page
// with our URL, not a second copy of their marketing site under our domain.
// (This does not weaken the doc's "no redirect for /deposits" rule — the deposits
// tool itself stays a transparent proxy.)
const depositsRedirects = [
  { source: '/apply', destination: '/onboarding', permanent: false },
  { source: '/en/apply', destination: '/onboarding', permanent: false },
  { source: '/en', destination: '/', permanent: false },

  // /knowledge was our own financing guide. The proxied /financing-guide is the
  // client's stated organic-traffic asset covering the same ground, so the two were
  // competing for the same queries on one domain — the exact problem the proxy exists
  // to solve. Consolidated onto the proxied guide.
  //
  // Permanent (308): the origin now emits
  // <link rel="canonical" href="https://nesbah.com.sa/financing-guide">, verified
  // 2026-08-02, so /knowledge's accumulated authority consolidates onto our domain
  // rather than being handed to nesbah.net.
  { source: '/knowledge', destination: '/financing-guide', permanent: true },
]

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return DEPOSITS_PROXY_ENABLED ? depositsRewrites : []
  },
  async redirects() {
    return DEPOSITS_PROXY_ENABLED ? depositsRedirects : []
  },
}
export default nextConfig

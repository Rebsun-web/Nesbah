// Reverse proxy for the deposits comparison tool and financing guide, which live in
// a separate codebase (nesbah.net) so rate corrections ship without a main-site
// deployment. See next.config.mjs for the static-asset rewrites that accompany this.
//
// WHY A ROUTE HANDLER RATHER THAN A next.config REWRITE
//
// The proxied app is a single-page app (TanStack Router). A plain rewrite serves its
// HTML faithfully, but once it has booted, clicking any in-app link is handled
// CLIENT-SIDE — no request reaches this server. Because its route chunks all live
// under /assets/* (which we must proxy for the deposits page to work at all), the
// app can fetch and render ANY of its own routes while the address bar still shows
// our domain. Observed symptom: clicking "Home" on /deposits renders nesbah.net's
// homepage at nesbah.com.sa/, so the same URL serves two different pages depending
// on how the visitor arrived — bypassing our homepage, our onboarding funnel and
// our database.
//
// Serving the document ourselves lets us inject a small navigation guard that
// confines the proxied app to an explicit allowlist of paths. Every other link
// becomes a real document navigation, which this server answers — so it lands on
// our own pages, with our design, and our redirects apply.
//
// This does not touch the tool, its rate table or its calculator, all of which stay
// exactly as nesbah.net serves them.

const DEPOSITS_ORIGIN = process.env.DEPOSITS_ORIGIN || 'https://nesbah.net';

// The ONLY paths that belong to the proxied surface. Anything not matched here is
// ours. Keep in sync with the rewrite list in next.config.mjs.
export const PROXIED_PATHS = [
    '/deposits',
    '/en/deposits',
    '/financing-guide',
    '/en/financing-guide',
];

// Client-side guard, injected into every proxied document. Registered in the capture
// phase and inlined in <head> so it runs before the app hydrates and therefore sees
// the click before the router's own handler does.
function navigationGuard() {
    const allow = JSON.stringify(PROXIED_PATHS);
    return `<script>(function(){
var A=${allow};
function inScope(p){
  for(var i=0;i<A.length;i++){ if(p===A[i]||p.indexOf(A[i]+'/')===0) return true; }
  return false;
}
document.addEventListener('click',function(e){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var n=e.target;
  while(n&&n.nodeName!=='A'){n=n.parentElement;}
  if(!n)return;
  var h=n.getAttribute('href');
  if(!h||h.charAt(0)==='#')return;
  var u;
  try{u=new URL(h,location.href);}catch(_){return;}
  if(u.origin!==location.origin)return;   // external links behave normally
  if(inScope(u.pathname))return;          // stays inside the proxied surface
  e.preventDefault();e.stopPropagation();
  location.assign(u.href);                // real navigation -> our server answers
},true);
})();</script>`;
}

// Response headers we must not blindly forward: hop-by-hop headers, and anything
// describing an encoding/length that no longer matches after we inject the script.
const STRIP_HEADERS = new Set([
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
    // Origin cookies are scoped to nesbah.net and would be dropped by the browser
    // anyway; forwarding them just adds noise.
    'set-cookie',
]);

/**
 * Proxy one document request to the deposits origin.
 * `path` is the origin-relative path including any query string.
 */
export async function proxyDepositsDocument(request, path) {
    const url = new URL(request.url);
    const target = `${DEPOSITS_ORIGIN}${path}${url.search}`;

    let originResponse;
    try {
        originResponse = await fetch(target, {
            method: 'GET',
            headers: {
                // Forward what the origin needs to render correctly, nothing more.
                accept: request.headers.get('accept') || 'text/html',
                'accept-language': request.headers.get('accept-language') || '',
                'user-agent': request.headers.get('user-agent') || '',
                // Cloudflare fronts the origin; a plausible referer avoids being
                // treated as an unattributed bot.
                referer: DEPOSITS_ORIGIN,
            },
            redirect: 'follow',
        });
    } catch (err) {
        console.error('[deposits-proxy] origin unreachable', { target, message: err.message });
        return new Response('Deposits service temporarily unavailable', {
            status: 502,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
    }

    const headers = new Headers();
    originResponse.headers.forEach((value, key) => {
        if (!STRIP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    });

    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        // Not a document (unexpected here) — pass it through untouched.
        return new Response(originResponse.body, { status: originResponse.status, headers });
    }

    let html = await originResponse.text();
    const guard = navigationGuard();
    // Inject as early as possible so the capture listener beats hydration.
    html = html.includes('<head>')
        ? html.replace('<head>', `<head>${guard}`)
        : guard + html;

    // Rates change frequently and must never be served stale.
    headers.set('cache-control', 'no-store, must-revalidate');

    return new Response(html, { status: originResponse.status, headers });
}

// Proxied surface: the financing guide (Arabic) — the other organic-traffic asset.
import { proxyDepositsDocument } from '@/lib/deposits-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    return proxyDepositsDocument(request, '/financing-guide');
}

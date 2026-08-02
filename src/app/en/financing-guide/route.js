// Proxied surface: the financing guide (English).
import { proxyDepositsDocument } from '@/lib/deposits-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    return proxyDepositsDocument(request, '/en/financing-guide');
}

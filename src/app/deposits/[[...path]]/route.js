// Proxied surface: the deposits comparison tool (Arabic). See src/lib/deposits-proxy.js.
import { proxyDepositsDocument } from '@/lib/deposits-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { path } = await params;
    const suffix = path?.length ? `/${path.join('/')}` : '';
    return proxyDepositsDocument(request, `/deposits${suffix}`);
}

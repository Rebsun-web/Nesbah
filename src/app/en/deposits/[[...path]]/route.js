// Proxied surface: the deposits comparison tool (English).
import { proxyDepositsDocument } from '@/lib/deposits-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { path } = await params;
    const suffix = path?.length ? `/${path.join('/')}` : '';
    return proxyDepositsDocument(request, `/en/deposits${suffix}`);
}

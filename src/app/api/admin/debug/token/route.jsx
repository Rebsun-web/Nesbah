import { NextResponse } from 'next/server'

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        console.log('🔧 Debug token route: Checking for admin token');
        console.log('🔧 Debug token route: Token found:', !!adminToken);
        console.log('🔧 Debug token route: Token value (first 50 chars):', adminToken ? adminToken.substring(0, 50) + '...' : 'null');
        
        if (!adminToken) {
            return NextResponse.json({
                success: false,
                error: 'No admin token found in cookies',
                cookies: Object.fromEntries(req.cookies.getAll().map(cookie => [cookie.name, cookie.value]))
            });
        }

        return NextResponse.json({
            success: true,
            tokenExists: true,
            tokenLength: adminToken.length,
            tokenPreview: adminToken.substring(0, 50) + '...',
            allCookies: Object.fromEntries(req.cookies.getAll().map(cookie => [cookie.name, cookie.value]))
        });

    } catch (error) {
        console.error('Debug token error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

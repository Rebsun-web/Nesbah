import { NextResponse } from 'next/server';
import { withAdminSession, getAdminUserFromRequest } from '@/lib/auth/admin-session-middleware';

export const GET = withAdminSession(async (req) => {
    console.log('🔧 Test API: Request received')
    
    // Get admin user from session (no database query needed)
    const adminUser = getAdminUserFromRequest(req);
    
    return NextResponse.json({
        success: true,
        message: 'Test API is working with session-based authentication',
        adminUser: {
            email: adminUser.email,
            role: adminUser.role
        },
        timestamp: new Date().toISOString()
    });
});

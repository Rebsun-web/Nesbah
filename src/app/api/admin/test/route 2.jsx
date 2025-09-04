import { NextResponse } from 'next/server';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        console.log('🔧 Test API: Request received')
        
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json(
                { success: false, error: 'No admin token found' },
                { status: 401 }
            );
        }

        // Validate admin session using JWT
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const adminUser = sessionValidation.adminUser;
        
        return NextResponse.json({
            success: true,
            message: 'Test API is working with JWT authentication',
            adminUser: {
                email: adminUser.email,
                role: adminUser.role
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Test API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

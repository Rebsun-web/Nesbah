import { NextResponse } from 'next/server';
import { AuctionExpiryHandler } from '@/lib/auction-expiry-handler';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        console.log('🔄 Manual request to handle expired auctions...');
        
        const result = await AuctionExpiryHandler.handleExpiredAuctions();
        
        return NextResponse.json({
            success: true,
            message: 'Expired auctions processed successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ Error handling expired auctions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process expired auctions' },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        // Get urgent applications (approaching auction end)
        const urgentApplications = await AuctionExpiryHandler.getUrgentApplications();
        
        return NextResponse.json({
            success: true,
            data: {
                urgent_applications: urgentApplications,
                count: urgentApplications.length
            }
        });
    } catch (error) {
        console.error('❌ Error getting urgent applications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get urgent applications' },
            { status: 500 }
        );
    }
}

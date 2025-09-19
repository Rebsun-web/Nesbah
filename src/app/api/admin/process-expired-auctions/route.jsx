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

        console.log('🔄 Manual request to process expired auctions...');
        
        // Process expired auctions
        const result = await AuctionExpiryHandler.handleExpiredAuctions();
        
        return NextResponse.json({
            success: true,
            message: `Processed ${result.processed} expired auctions`,
            data: {
                processed: result.processed,
                completed: result.completed,
                ignored: result.ignored,
                processedBy: sessionValidation.adminUser.email,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error processing expired auctions:', error);
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

        // Get applications that need status updates
        const { AuctionExpiryHandler } = await import('@/lib/auction-expiry-handler');
        
        // Check for urgent applications (approaching expiry)
        const urgentApplications = await AuctionExpiryHandler.getUrgentApplications();
        
        return NextResponse.json({
            success: true,
            data: {
                urgent_applications: urgentApplications,
                urgent_count: urgentApplications.length
            }
        });
    } catch (error) {
        console.error('❌ Error checking urgent applications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check urgent applications' },
            { status: 500 }
        );
    }
}

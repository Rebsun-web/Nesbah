import { NextResponse } from 'next/server';
import auctionNotificationHandler from '@/lib/auction-notification-handler';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        if (!action || !['start', 'stop', 'status'].includes(action)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid action. Must be: start, stop, or status' 
            }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'start':
                auctionNotificationHandler.start();
                result = { message: 'Auction notification handler started successfully' };
                break;
                
            case 'stop':
                auctionNotificationHandler.stop();
                result = { message: 'Auction notification handler stopped successfully' };
                break;
                
            case 'status':
                result = auctionNotificationHandler.getStatus();
                break;
        }

        return NextResponse.json({
            success: true,
            action: action,
            ...result
        });

    } catch (error) {
        console.error('Error in auction notification admin API:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

/**
 * GET endpoint to get current status
 */
export async function GET(req) {
    try {
        const status = auctionNotificationHandler.getStatus();
        
        return NextResponse.json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('Error getting auction notification status:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

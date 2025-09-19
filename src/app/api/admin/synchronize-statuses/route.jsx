import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import StatusSynchronizer from '@/lib/status-synchronizer';

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

        console.log('🔄 Admin requested status synchronization...');
        
        const client = await pool.connectWithRetry(2, 1000, 'synchronize-statuses');
        
        try {
            await client.query('BEGIN');
            
            // Synchronize all application statuses
            const result = await StatusSynchronizer.synchronizeAllApplicationStatuses(client);
            
            await client.query('COMMIT');
            
            return NextResponse.json({
                success: true,
                message: `Status synchronization completed: ${result.synchronized} applications updated`,
                data: {
                    total_checked: result.total_checked,
                    synchronized: result.synchronized,
                    errors: result.errors,
                    synchronizedBy: sessionValidation.adminUser.email,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error during status synchronization:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to synchronize application statuses',
                details: error.message
            }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error in status synchronization API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to synchronize application statuses' },
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

        // Check which applications need synchronization (without updating them)
        const client = await pool.connectWithRetry(2, 1000, 'check-status-sync');
        
        try {
            const query = `
                SELECT 
                    application_id,
                    status,
                    current_application_status,
                    auction_end_time,
                    offers_count,
                    submitted_at,
                    trade_name
                FROM pos_application 
                WHERE status IN ('live_auction', 'completed', 'ignored')
                ORDER BY application_id
            `;
            
            const result = await client.query(query);
            const applications = result.rows;
            
            const needsSync = applications.filter(app => StatusSynchronizer.needsSynchronization(app));
            
            return NextResponse.json({
                success: true,
                data: {
                    total_applications: applications.length,
                    need_synchronization: needsSync.length,
                    applications_needing_sync: needsSync.map(app => ({
                        application_id: app.application_id,
                        trade_name: app.trade_name,
                        current_status: app.current_application_status || app.status,
                        correct_status: StatusSynchronizer.getCorrectStatus(app),
                        auction_end_time: app.auction_end_time,
                        offers_count: app.offers_count
                    }))
                }
            });
            
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error checking status synchronization:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check status synchronization' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
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

        console.log('🔧 Fixing status discrepancies...');
        
        const client = await pool.connectWithRetry(2, 1000, 'fix-status-discrepancies');
        
        try {
            // Find applications where database status doesn't match calculated status
            const query = `
                SELECT 
                    application_id,
                    status as db_status,
                    auction_end_time,
                    offers_count,
                    CASE 
                        WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                        WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END as calculated_status
                FROM pos_application 
                WHERE status != CASE 
                    WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                    WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                    ELSE 'live_auction'
                END
                ORDER BY application_id
            `;
            
            const result = await client.query(query);
            
            if (result.rows.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No status discrepancies found',
                    data: { fixed: 0, applications: [] }
                });
            }
            
            console.log(`Found ${result.rows.length} applications with status discrepancies`);
            
            let fixedCount = 0;
            const fixedApplications = [];
            
            for (const app of result.rows) {
                try {
                    await client.query('BEGIN');
                    
                    // Update the status to match the calculated status
                    const updateResult = await client.query(
                        'UPDATE pos_application SET status = $1, updated_at = NOW() WHERE application_id = $2',
                        [app.calculated_status, app.application_id]
                    );
                    
                    if (updateResult.rowCount > 0) {
                        // Log the status correction
                        await client.query(`
                            INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                            VALUES ($1, $2, $3, $4, $5, NOW())
                        `, [app.application_id, app.db_status, app.calculated_status, sessionValidation.adminUser.admin_id || 1, 'Admin status discrepancy fix']);
                        
                        fixedCount++;
                        fixedApplications.push({
                            application_id: app.application_id,
                            from_status: app.db_status,
                            to_status: app.calculated_status
                        });
                        
                        console.log(`✅ Fixed application ${app.application_id}: ${app.db_status} → ${app.calculated_status}`);
                    }
                    
                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Error fixing application ${app.application_id}:`, error);
                }
            }
            
            return NextResponse.json({
                success: true,
                message: `Fixed ${fixedCount} status discrepancies`,
                data: {
                    fixed: fixedCount,
                    total_discrepancies: result.rows.length,
                    applications: fixedApplications
                }
            });
            
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error fixing status discrepancies:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fix status discrepancies' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        console.log('🧪 Updating existing application with fresh 5-minute expiry...');
        
        const client = await pool.connectWithRetry(2, 1000, 'update-existing-app-fresh');
        
        try {
            await client.query('BEGIN');
            
            // Update the existing application with fresh timestamps
            const now = new Date();
            const auction_end_time = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
            
            const updateResult = await client.query(
                `UPDATE pos_application 
                 SET 
                    status = 'live_auction',
                    submitted_at = $1,
                    auction_end_time = $2,
                    offers_count = 0,
                    created_at = $3,
                    updated_at = $4
                 WHERE application_id = 2
                 RETURNING application_id, trade_name, user_id`,
                [now, auction_end_time, now, now]
            );
            
            if (updateResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            const app = updateResult.rows[0];
            
            await client.query('COMMIT');
            
            const timeUntilExpiry = Math.round((auction_end_time - now) / 1000 / 60);
            
            console.log('✅ Application updated with fresh 5-minute expiry!');
            console.log(`   - Application ID: ${app.application_id}`);
            console.log(`   - Business: ${app.trade_name}`);
            console.log(`   - User ID: ${app.user_id}`);
            console.log(`   - New Submitted: ${now.toLocaleString()}`);
            console.log(`   - New Expires: ${auction_end_time.toLocaleString()}`);
            console.log(`   - Time until expiry: ${timeUntilExpiry} minutes`);
            
            return NextResponse.json({
                success: true,
                message: 'Application updated with fresh 5-minute expiry',
                data: {
                    application_id: app.application_id,
                    user_id: app.user_id,
                    trade_name: app.trade_name,
                    status: 'live_auction',
                    submitted_at: now.toISOString(),
                    auction_end_time: auction_end_time.toISOString(),
                    time_until_expiry_minutes: timeUntilExpiry,
                    submitted_at_formatted: now.toLocaleString(),
                    auction_end_time_formatted: auction_end_time.toLocaleString()
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error updating application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update application' },
            { status: 500 }
        );
    }
}

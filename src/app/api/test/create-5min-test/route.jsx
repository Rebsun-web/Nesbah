import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        console.log('🧪 Creating 5-minute test application...');
        
        const client = await pool.connectWithRetry(2, 1000, 'create-5min-test');
        
        try {
            await client.query('BEGIN');
            
            // Find any existing application to modify
            const findAppResult = await client.query(
                `SELECT application_id, user_id, trade_name, status 
                 FROM pos_application 
                 ORDER BY application_id DESC 
                 LIMIT 1`
            );
            
            if (findAppResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No applications found in database'
                });
            }
            
            const app = findAppResult.rows[0];
            const application_id = app.application_id;
            const trade_name = app.trade_name;
            
            // Set auction_end_time to 5 minutes from now
            const now = new Date();
            const auction_end_time = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
            
            // Update the application
            await client.query(
                `UPDATE pos_application 
                 SET 
                    status = 'live_auction',
                    auction_end_time = $1,
                    offers_count = 0,
                    updated_at = NOW()
                 WHERE application_id = $2`,
                [auction_end_time, application_id]
            );
            
            await client.query('COMMIT');
            
            const timeUntilExpiry = Math.round((auction_end_time - now) / 1000 / 60);
            
            console.log('✅ 5-minute test application created successfully!');
            console.log(`   - Application ID: ${application_id}`);
            console.log(`   - Business: ${trade_name}`);
            console.log(`   - New Status: live_auction`);
            console.log(`   - Submitted: ${now.toLocaleString()}`);
            console.log(`   - Expires: ${auction_end_time.toLocaleString()}`);
            console.log(`   - Time until expiry: ${timeUntilExpiry} minutes`);
            
            return NextResponse.json({
                success: true,
                message: '5-minute test application created successfully',
                data: {
                    application_id,
                    trade_name,
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
        console.error('❌ Error creating 5-minute test application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create 5-minute test application' },
            { status: 500 }
        );
    }
}

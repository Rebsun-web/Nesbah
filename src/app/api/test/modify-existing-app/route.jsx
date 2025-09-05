import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        console.log('🧪 Modifying existing application to expire in 10 minutes...');
        
        const client = await pool.connectWithRetry(2, 1000, 'test-modify-app');
        
        try {
            await client.query('BEGIN');
            
            // Find any existing application (regardless of status)
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
            
            // Set auction_end_time to 10 minutes from now
            const auction_end_time = new Date(Date.now() + 10 * 60 * 1000);
            
            // Update the application
            await client.query(
                `UPDATE pos_application 
                 SET 
                    status = 'live_auction',
                    auction_end_time = $1,
                    updated_at = NOW()
                 WHERE application_id = $2`,
                [auction_end_time, application_id]
            );
            
            await client.query('COMMIT');
            
            console.log('✅ Test application modified successfully!');
            console.log(`   - Application ID: ${application_id}`);
            console.log(`   - Business: ${trade_name}`);
            console.log(`   - New Status: live_auction`);
            console.log(`   - Expires: ${auction_end_time.toLocaleString()}`);
            console.log(`   - Time until expiry: ${Math.round((auction_end_time - new Date()) / 1000 / 60)} minutes`);
            
            return NextResponse.json({
                success: true,
                message: 'Test application modified successfully',
                data: {
                    application_id,
                    trade_name,
                    status: 'live_auction',
                    auction_end_time,
                    time_until_expiry_minutes: Math.round((auction_end_time - new Date()) / 1000 / 60)
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error modifying test application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to modify test application' },
            { status: 500 }
        );
    }
}

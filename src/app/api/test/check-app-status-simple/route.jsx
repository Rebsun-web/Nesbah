import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Checking application status...');
        
        const client = await pool.connect();
        
        try {
            // Simple query to check application status
            const result = await client.query(`
                SELECT 
                    application_id,
                    status,
                    submitted_at,
                    auction_end_time,
                    offers_count,
                    trade_name,
                    NOW() as current_time,
                    EXTRACT(EPOCH FROM (auction_end_time - NOW())) as seconds_remaining
                FROM pos_application 
                WHERE application_id = 2
            `);
            
            if (result.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            const app = result.rows[0];
            const isExpired = app.seconds_remaining < 0;
            
            console.log('📊 Application Status:');
            console.log(`   - ID: ${app.application_id}`);
            console.log(`   - Status: ${app.status}`);
            console.log(`   - Trade: ${app.trade_name}`);
            console.log(`   - Submitted: ${app.submitted_at}`);
            console.log(`   - Auction End: ${app.auction_end_time}`);
            console.log(`   - Current Time: ${app.current_time}`);
            console.log(`   - Seconds Remaining: ${app.seconds_remaining}`);
            console.log(`   - Is Expired: ${isExpired}`);
            console.log(`   - Offers Count: ${app.offers_count}`);
            
            return NextResponse.json({
                success: true,
                data: {
                    application_id: app.application_id,
                    status: app.status,
                    trade_name: app.trade_name,
                    submitted_at: app.submitted_at,
                    auction_end_time: app.auction_end_time,
                    current_time: app.current_time,
                    seconds_remaining: app.seconds_remaining,
                    is_expired: isExpired,
                    offers_count: app.offers_count
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking application status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check application status' },
            { status: 500 }
        );
    }
}

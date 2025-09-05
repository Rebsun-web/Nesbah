import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Checking test application status...');
        
        const client = await pool.connectWithRetry(2, 1000, 'check-app-status');
        
        try {
            // Find the test application (Application ID 7)
            const appResult = await client.query(
                `SELECT 
                    application_id, 
                    status, 
                    submitted_at, 
                    auction_end_time,
                    trade_name,
                    offers_count,
                    EXTRACT(EPOCH FROM (auction_end_time - NOW())) as seconds_remaining
                 FROM pos_application 
                 WHERE application_id = 7`
            );
            
            if (appResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Test application not found'
                });
            }
            
            const app = appResult.rows[0];
            const secondsRemaining = Math.max(0, Math.floor(app.seconds_remaining));
            const minutesRemaining = Math.floor(secondsRemaining / 60);
            const hoursRemaining = Math.floor(minutesRemaining / 60);
            
            const now = new Date();
            const auctionEnd = new Date(app.auction_end_time);
            const submittedAt = new Date(app.submitted_at);
            
            console.log('📊 Test Application Status:');
            console.log(`   - Application ID: ${app.application_id}`);
            console.log(`   - Business: ${app.trade_name}`);
            console.log(`   - Status: ${app.status}`);
            console.log(`   - Submitted: ${submittedAt.toLocaleString()}`);
            console.log(`   - Auction Ends: ${auctionEnd.toLocaleString()}`);
            console.log(`   - Time Remaining: ${minutesRemaining} minutes (${secondsRemaining} seconds)`);
            console.log(`   - Offers Count: ${app.offers_count}`);
            
            return NextResponse.json({
                success: true,
                data: {
                    application_id: app.application_id,
                    status: app.status,
                    trade_name: app.trade_name,
                    submitted_at: app.submitted_at,
                    auction_end_time: app.auction_end_time,
                    offers_count: app.offers_count,
                    time_remaining: {
                        total_seconds: secondsRemaining,
                        minutes: minutesRemaining,
                        hours: hoursRemaining,
                        formatted: `${minutesRemaining} minutes ${secondsRemaining % 60} seconds`
                    },
                    is_expired: secondsRemaining <= 0,
                    current_time: now.toISOString(),
                    auction_end_time_formatted: auctionEnd.toLocaleString()
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

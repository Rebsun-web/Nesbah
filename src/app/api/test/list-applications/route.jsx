import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Listing all applications...');
        
        const client = await pool.connectWithRetry(2, 1000, 'list-applications');
        
        try {
            // Find all applications
            const appsResult = await client.query(
                `SELECT 
                    pa.application_id,
                    pa.user_id,
                    pa.status,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.trade_name,
                    pa.offers_count,
                    u.email,
                    u.entity_name,
                    EXTRACT(EPOCH FROM (pa.auction_end_time - NOW())) as seconds_remaining
                 FROM pos_application pa
                 LEFT JOIN users u ON pa.user_id = u.user_id
                 ORDER BY pa.application_id DESC
                 LIMIT 10`
            );
            
            console.log(`📊 Found ${appsResult.rows.length} applications:`);
            appsResult.rows.forEach((app, index) => {
                const minutesRemaining = Math.floor(app.seconds_remaining / 60);
                console.log(`   ${index + 1}. ID: ${app.application_id}, User: ${app.user_id} (${app.email}), Status: ${app.status}, Trade: ${app.trade_name}, Time Left: ${minutesRemaining} min`);
            });
            
            return NextResponse.json({
                success: true,
                data: {
                    applications: appsResult.rows,
                    count: appsResult.rows.length
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error listing applications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to list applications' },
            { status: 500 }
        );
    }
}

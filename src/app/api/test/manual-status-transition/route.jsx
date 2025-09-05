import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { STATUS_CALCULATION_SQL } from '@/lib/application-status';

export async function POST(req) {
    try {
        console.log('🧪 Manually triggering status transition...');
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Find applications that have expired and need status transition
            const expiredApplications = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.offers_count,
                    pa.auction_end_time,
                    pa.trade_name,
                    ${STATUS_CALCULATION_SQL}
                FROM pos_application pa
                WHERE pa.status = 'live_auction'
                AND pa.auction_end_time < NOW()
                ORDER BY pa.application_id
            `);
            
            console.log(`🔍 Found ${expiredApplications.rows.length} expired applications`);
            
            let completedCount = 0;
            let ignoredCount = 0;
            
            for (const app of expiredApplications.rows) {
                const newStatus = app.offers_count > 0 ? 'completed' : 'ignored';
                
                await client.query(
                    `UPDATE pos_application 
                     SET status = $1, updated_at = NOW()
                     WHERE application_id = $2`,
                    [newStatus, app.application_id]
                );
                
                console.log(`✅ Updated application ${app.application_id} (${app.trade_name}) to status: ${newStatus}`);
                
                if (newStatus === 'completed') {
                    completedCount++;
                } else {
                    ignoredCount++;
                }
            }
            
            await client.query('COMMIT');
            
            console.log(`✅ Manual status transition completed: ${expiredApplications.rows.length} applications processed`);
            console.log(`   - Completed: ${completedCount}`);
            console.log(`   - Ignored: ${ignoredCount}`);
            
            return NextResponse.json({
                success: true,
                message: 'Manual status transition completed',
                data: {
                    processed: expiredApplications.rows.length,
                    completed: completedCount,
                    ignored: ignoredCount
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error in manual status transition:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process status transition' },
            { status: 500 }
        );
    }
}

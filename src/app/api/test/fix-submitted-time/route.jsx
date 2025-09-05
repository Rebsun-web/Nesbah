import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        console.log('🧪 Fixing submitted_at timestamp for test application...');
        
        const client = await pool.connectWithRetry(2, 1000, 'fix-submitted-time');
        
        try {
            await client.query('BEGIN');
            
            // Update just the submitted_at timestamp to make it look fresh
            const now = new Date();
            
            const updateResult = await client.query(
                `UPDATE pos_application 
                 SET 
                    submitted_at = $1,
                    updated_at = $2
                 WHERE application_id = 2
                 RETURNING application_id, trade_name, submitted_at, auction_end_time`,
                [now, now]
            );
            
            if (updateResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Application not found'
                });
            }
            
            const app = updateResult.rows[0];
            const timeUntilExpiry = Math.round((new Date(app.auction_end_time) - now) / 1000 / 60);
            
            await client.query('COMMIT');
            
            console.log('✅ Submitted timestamp updated!');
            console.log(`   - Application ID: ${app.application_id}`);
            console.log(`   - Business: ${app.trade_name}`);
            console.log(`   - New Submitted: ${app.submitted_at}`);
            console.log(`   - Expires: ${app.auction_end_time}`);
            console.log(`   - Time until expiry: ${timeUntilExpiry} minutes`);
            
            return NextResponse.json({
                success: true,
                message: 'Submitted timestamp updated successfully',
                data: {
                    application_id: app.application_id,
                    trade_name: app.trade_name,
                    submitted_at: app.submitted_at,
                    auction_end_time: app.auction_end_time,
                    time_until_expiry_minutes: timeUntilExpiry
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error updating submitted timestamp:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update submitted timestamp' },
            { status: 500 }
        );
    }
}

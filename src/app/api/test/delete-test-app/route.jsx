import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(req) {
    try {
        console.log('🗑️ Deleting test application (ID: 7)...');
        
        const client = await pool.connectWithRetry(2, 1000, 'delete-test-app');
        
        try {
            await client.query('BEGIN');
            
            // Delete the POS application
            const deleteAppResult = await client.query(
                `DELETE FROM pos_application WHERE application_id = 7`
            );
            
            if (deleteAppResult.rowCount === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Test application not found'
                });
            }
            
            // Also delete the business user and user records if they exist
            await client.query(
                `DELETE FROM business_users WHERE user_id = 1001`
            );
            
            await client.query(
                `DELETE FROM users WHERE user_id = 1001`
            );
            
            await client.query('COMMIT');
            
            console.log('✅ Test application deleted successfully!');
            
            return NextResponse.json({
                success: true,
                message: 'Test application deleted successfully'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error deleting test application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete test application' },
            { status: 500 }
        );
    }
}

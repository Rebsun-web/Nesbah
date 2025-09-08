import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cascadeDeleteApplication } from '@/lib/cascade-deletion';

export async function DELETE(req) {
    try {
        console.log('🗑️ Deleting test application (ID: 7)...');
        
        const client = await pool.connectWithRetry(2, 1000, 'delete-test-app');
        
        try {
            await client.query('BEGIN');
            
            // Use the cascade deletion utility
            const result = await cascadeDeleteApplication(client, 7, true, 1001);
            
            if (!result.success) {
                await client.query('ROLLBACK');
                return NextResponse.json({
                    success: false,
                    error: result.error
                });
            }
            
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

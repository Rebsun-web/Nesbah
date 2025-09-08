import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateCascadeDeletion } from '@/lib/cascade-deletion';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const applicationId = parseInt(searchParams.get('applicationId') || '7');
        
        console.log(`🔍 Validating cascade deletion for application ${applicationId}...`);
        
        const client = await pool.connectWithRetry(2, 1000, 'validate-cascade-deletion');
        
        try {
            const validation = await validateCascadeDeletion(client, applicationId);
            
            return NextResponse.json({
                success: true,
                applicationId,
                validation,
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error validating cascade deletion:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate cascade deletion' },
            { status: 500 }
        );
    }
}

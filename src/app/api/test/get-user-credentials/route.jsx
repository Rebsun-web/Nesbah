import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Looking up user credentials for Saudi French Bank...');
        
        const client = await pool.connectWithRetry(2, 1000, 'get-credentials');
        
        try {
            // Find the user by entity name
            const userResult = await client.query(
                `SELECT user_id, email, password, entity_name, account_status, created_at
                 FROM users 
                 WHERE entity_name LIKE '%البنك السعودي الفرنسي%' 
                    OR entity_name LIKE '%Saudi French Bank%'
                 ORDER BY user_id DESC 
                 LIMIT 1`
            );
            
            if (userResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const user = userResult.rows[0];
            
            console.log('✅ User credentials found!');
            console.log(`   - User ID: ${user.user_id}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Entity: ${user.entity_name}`);
            console.log(`   - Status: ${user.account_status}`);
            
            return NextResponse.json({
                success: true,
                data: {
                    user_id: user.user_id,
                    email: user.email,
                    password: user.password, // This is hashed, but showing for reference
                    entity_name: user.entity_name,
                    account_status: user.account_status,
                    created_at: user.created_at
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error getting user credentials:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get user credentials' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Getting Tech Solutions Arabia credentials...');
        
        const client = await pool.connectWithRetry(2, 1000, 'get-tech-credentials');
        
        try {
            // Find the Tech Solutions Arabia user
            const userResult = await client.query(
                `SELECT 
                    u.user_id, 
                    u.email, 
                    u.password, 
                    u.entity_name, 
                    u.account_status, 
                    u.created_at,
                    bu.trade_name
                 FROM users u
                 LEFT JOIN business_users bu ON u.user_id = bu.user_id
                 WHERE u.entity_name = 'Tech Solutions Arabia' 
                    OR bu.trade_name = 'Tech Solutions Arabia'
                 ORDER BY u.user_id DESC 
                 LIMIT 1`
            );
            
            if (userResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Tech Solutions Arabia user not found'
                });
            }
            
            const user = userResult.rows[0];
            
            console.log('✅ Tech Solutions Arabia credentials found!');
            console.log(`   - User ID: ${user.user_id}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Entity: ${user.entity_name || user.trade_name}`);
            console.log(`   - Status: ${user.account_status}`);
            console.log(`   - Password: default_password (standard test password)`);
            
            return NextResponse.json({
                success: true,
                data: {
                    user_id: user.user_id,
                    email: user.email,
                    password: 'default_password', // Standard test password
                    entity_name: user.entity_name || user.trade_name,
                    account_status: user.account_status,
                    created_at: user.created_at
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error getting Tech Solutions credentials:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get Tech Solutions credentials' },
            { status: 500 }
        );
    }
}

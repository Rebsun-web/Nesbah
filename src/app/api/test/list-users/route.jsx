import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        console.log('🔍 Listing available users...');
        
        const client = await pool.connectWithRetry(2, 1000, 'list-users');
        
        try {
            // Find all business users
            const usersResult = await client.query(
                `SELECT 
                    u.user_id, 
                    u.email, 
                    u.entity_name, 
                    u.account_status, 
                    u.created_at,
                    bu.trade_name
                 FROM users u
                 LEFT JOIN business_users bu ON u.user_id = bu.user_id
                 WHERE u.user_type = 'business_user'
                 ORDER BY u.user_id DESC
                 LIMIT 10`
            );
            
            console.log(`📊 Found ${usersResult.rows.length} business users:`);
            usersResult.rows.forEach((user, index) => {
                console.log(`   ${index + 1}. ID: ${user.user_id}, Email: ${user.email}, Entity: ${user.entity_name || user.trade_name}`);
            });
            
            return NextResponse.json({
                success: true,
                data: {
                    users: usersResult.rows,
                    count: usersResult.rows.length
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error listing users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to list users' },
            { status: 500 }
        );
    }
}

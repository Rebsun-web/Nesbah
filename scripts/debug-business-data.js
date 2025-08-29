require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

async function debugBusinessData() {
    console.log('🔍 Debugging business data in database...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const client = await pool.connect();
        
        // Check users table
        console.log('\n📊 Users table:');
        const usersResult = await client.query('SELECT user_id, email, user_type, entity_name FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('Recent users:', usersResult.rows);
        
        // Check business_users table
        console.log('\n📊 Business users table:');
        const businessResult = await client.query('SELECT user_id, trade_name, cr_national_number, cr_number FROM business_users ORDER BY user_id DESC LIMIT 5');
        console.log('Recent business users:', businessResult.rows);
        
        // Check if there's a mismatch
        console.log('\n🔍 Checking for data consistency:');
        const mismatchResult = await client.query(`
            SELECT 
                u.user_id as user_table_id,
                u.email,
                u.user_type,
                bu.user_id as business_table_id,
                bu.trade_name,
                bu.cr_national_number
            FROM users u
            LEFT JOIN business_users bu ON u.user_id = bu.user_id
            WHERE u.user_type = 'business_user'
            ORDER BY u.created_at DESC
            LIMIT 5
        `);
        
        console.log('User vs Business data consistency:', mismatchResult.rows);
        
        client.release();
    } catch (error) {
        console.error('Error debugging business data:', error);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    debugBusinessData();
}

module.exports = { debugBusinessData };

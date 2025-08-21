import pool from './src/lib/db.js';

async function createTestUsers() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create business users
        for (let i = 1; i <= 5; i++) {
            // First create user record
            const userResult = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [`business${i}@test.com`, 'password123', 'business_user', `Business ${i}`, 'active']
            );
            
            const userId = userResult.rows[0].user_id;
            
            // Then create business user record
            await client.query(
                `INSERT INTO business_users (user_id, cr_national_number, trade_name, address, sector, registration_status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, `CR${Date.now()}${i}`, `Business ${i}`, `Address ${i}`, 'Technology', 'active']
            );
        }
        
        // Create bank users
        for (let i = 1; i <= 3; i++) {
            // First create user record
            const userResult = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [`bank${i}@test.com`, 'password123', 'bank_user', `Bank ${i}`, 'active']
            );
            
            const userId = userResult.rows[0].user_id;
            
            // Then create bank user record
            await client.query(
                `INSERT INTO bank_users (user_id, email, credit_limit)
                 VALUES ($1, $2, $3)`,
                [userId, `bank${i}@test.com`, 10000.00]
            );
        }
        
        await client.query('COMMIT');
        console.log('✅ Test users created successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating test users:', error);
    } finally {
        client.release();
    }
}

createTestUsers();

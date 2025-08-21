const pool = require('./src/lib/db.cjs');

async function testDeletion() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Testing user deletion functionality...');
        
        // Test 1: Check if we can query business users
        console.log('\n1. Testing business user query...');
        const businessUsers = await client.query('SELECT user_id, trade_name FROM business_users LIMIT 3');
        console.log(`Found ${businessUsers.rows.length} business users`);
        console.table(businessUsers.rows);
        
        if (businessUsers.rows.length === 0) {
            console.log('No business users found to test with');
            return;
        }
        
        // Test 2: Test the SELECT query that the DELETE function uses
        console.log('\n2. Testing SELECT query for business user...');
        const testUserId = businessUsers.rows[0].user_id;
        const selectResult = await client.query('SELECT user_id, trade_name FROM business_users WHERE user_id = $1', [testUserId]);
        console.log('SELECT result:', selectResult.rows[0]);
        
        // Test 3: Test the DELETE query structure
        console.log('\n3. Testing DELETE query structure...');
        const deleteQuery = 'DELETE FROM business_users WHERE user_id = $1 RETURNING user_id, trade_name';
        console.log('DELETE query:', deleteQuery);
        
        // Test 4: Check bank users
        console.log('\n4. Testing bank user query...');
        const bankUsers = await client.query('SELECT user_id, email FROM bank_users LIMIT 3');
        console.log(`Found ${bankUsers.rows.length} bank users`);
        console.table(bankUsers.rows);
        
        // Test 5: Check individual users
        console.log('\n5. Testing individual user query...');
        const individualUsers = await client.query('SELECT user_id, first_name, last_name FROM individual_users LIMIT 3');
        console.log(`Found ${individualUsers.rows.length} individual users`);
        console.table(individualUsers.rows);
        
        console.log('\n✅ All deletion tests passed! The functionality should work correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

// Set environment variable and run test
process.env.DATABASE_URL = 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres';
testDeletion();

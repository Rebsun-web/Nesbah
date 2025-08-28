const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkBankUsersStructure() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking bank_users table structure...\n');
        
        // Check table structure
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'bank_users' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 bank_users table columns:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
        
        // Check all bank users
        const bankUsers = await client.query(`
            SELECT * FROM bank_users
        `);
        
        console.log(`\n🏦 Found ${bankUsers.rows.length} bank users:`);
        bankUsers.rows.forEach((bank, index) => {
            console.log(`  ${index + 1}. Bank User ID: ${bank.user_id}`);
            console.log(`     Data:`, bank);
            console.log('');
        });
        
        // Check users table for bank users
        const bankUsersFromUsers = await client.query(`
            SELECT u.*, bu.*
            FROM users u
            JOIN bank_users bu ON u.user_id = bu.user_id
            WHERE u.user_type = 'bank_user'
        `);
        
        console.log(`\n🏦 Found ${bankUsersFromUsers.rows.length} bank users from users table:`);
        bankUsersFromUsers.rows.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.entity_name || user.email} (ID: ${user.user_id})`);
            console.log(`     Email: ${user.email}`);
            console.log(`     User Type: ${user.user_type}`);
            console.log(`     Bank Data:`, user);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error checking bank_users structure:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkBankUsersStructure()
    .then(() => {
        console.log('\n✅ Bank users structure check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Bank users structure check failed:', error);
        process.exit(1);
    });

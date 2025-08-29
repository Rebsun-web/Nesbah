require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function debugPasswordIssue() {
    console.log('🔍 Debugging password hashing issue...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const client = await pool.connect();
        
        // Check all business users and their password hashes
        console.log('\n📊 All business users and their password hashes:');
        const usersResult = await client.query(`
            SELECT user_id, email, password, user_type, created_at 
            FROM users 
            WHERE user_type = 'business_user' 
            ORDER BY created_at DESC
        `);
        
        for (const user of usersResult.rows) {
            console.log(`\n--- User: ${user.email} (ID: ${user.user_id}) ---`);
            console.log('Password hash:', user.password);
            console.log('Password hash length:', user.password?.length || 0);
            console.log('Created at:', user.created_at);
            
            // Test if it's a valid bcrypt hash
            if (user.password && user.password.startsWith('$2b$')) {
                console.log('✅ Valid bcrypt hash format');
                
                // Test some common passwords
                const testPasswords = ['Business123!', 'changeme123', 'password', 'admin123', 'test123'];
                for (const testPassword of testPasswords) {
                    try {
                        const isMatch = await bcrypt.compare(testPassword, user.password);
                        console.log(`  "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
                    } catch (error) {
                        console.log(`  "${testPassword}": ❌ ERROR - ${error.message}`);
                    }
                }
            } else {
                console.log('❌ Not a valid bcrypt hash');
                console.log('Hash starts with:', user.password?.substring(0, 10) || 'null');
            }
        }
        
        client.release();
    } catch (error) {
        console.error('Error debugging password issue:', error);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    debugPasswordIssue();
}

module.exports = { debugPasswordIssue };

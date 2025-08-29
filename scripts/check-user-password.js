require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function checkUserPassword() {
    console.log('🔍 Checking user password...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const client = await pool.connect();
        
        // Check the password hash for the test user
        const userResult = await client.query(
            'SELECT user_id, email, password FROM users WHERE email = $1',
            ['nikitamail2@nesbah.com']
        );
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            console.log('User found:', { user_id: user.user_id, email: user.email });
            console.log('Password hash:', user.password);
            
            // Test different passwords
            const testPasswords = ['Business123!', 'changeme123', 'password', 'admin123'];
            
            for (const testPassword of testPasswords) {
                const isMatch = await bcrypt.compare(testPassword, user.password);
                console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
            }
        } else {
            console.log('User not found');
        }
        
        client.release();
    } catch (error) {
        console.error('Error checking user password:', error);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    checkUserPassword();
}

module.exports = { checkUserPassword };

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testPasswordVerification() {
    const client = await pool.connect();
    
    try {
        console.log('🔐 Testing password verification for test2@business.com...\n');
        
        // Get the user's actual password hash from database
        const userQuery = await client.query(
            'SELECT password, user_type FROM users WHERE email = $1',
            ['test2@business.com']
        );
        
        if (userQuery.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const user = userQuery.rows[0];
        console.log('📧 User found:', 'test2@business.com');
        console.log('👤 User type:', user.user_type);
        console.log('🔑 Stored password (raw):', user.password);
        console.log('🔑 Password length:', user.password.length);
        console.log('🔑 Is hashed?', user.password.startsWith('$2b$') || user.password.startsWith('$2a$'));
        
        // Test different password variations
        const testPasswords = [
            'password123',
            'Password123',
            'PASSWORD123',
            'password',
            '123',
            'test123',
            'business123'
        ];
        
        console.log('\n🧪 Testing password variations:');
        console.log('=' .repeat(50));
        
        for (const testPassword of testPasswords) {
            let isMatch = false;
            
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                // Password is hashed, use bcrypt compare
                isMatch = await bcrypt.compare(testPassword, user.password);
            } else {
                // Password is plain text, direct comparison
                isMatch = (testPassword === user.password);
            }
            
            console.log(`🔑 "${testPassword}" -> ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }
        
        // If password is plain text, hash it properly
        if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
            console.log('\n⚠️  Password is stored as plain text!');
            console.log('🔧 Hashing password for security...');
            
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            
            // Update the password in database
            await client.query(
                'UPDATE users SET password = $1 WHERE email = $2',
                [hashedPassword, 'test2@business.com']
            );
            
            console.log('✅ Password hashed and updated in database');
            console.log('🔑 New hash:', hashedPassword);
        }
        
    } catch (error) {
        console.error('❌ Error testing password verification:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    testPasswordVerification()
        .then(() => {
            console.log('\n✅ Password verification testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Password verification testing failed:', error);
            process.exit(1);
        });
}

module.exports = { testPasswordVerification };

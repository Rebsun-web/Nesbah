const pool = require('../src/lib/db.cjs');
const bcrypt = require('bcrypt');

async function checkUserPasswords() {
    console.log('🔍 Checking user passwords...');
    
    try {
        const client = await pool.connectWithRetry();
        
        try {
            // Get all users with their password hashes
            const usersResult = await client.query(`
                SELECT user_id, email, user_type, password
                FROM users 
                ORDER BY user_type, email
            `);
            
            if (usersResult.rows.length === 0) {
                console.log('❌ No users found');
                return;
            }
            
            console.log(`✅ Found ${usersResult.rows.length} users:\n`);
            
            // Common test passwords to try
            const testPasswords = [
                'password123',
                'changeme123',
                'admin123',
                'business123',
                'bank123',
                'nesbah123',
                'test123',
                '123456',
                'password',
                'admin',
                'business',
                'bank'
            ];
            
            for (const user of usersResult.rows) {
                console.log(`👤 ${user.email} (${user.user_type})`);
                console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
                
                // Test common passwords
                let foundPassword = null;
                for (const testPassword of testPasswords) {
                    try {
                        const isMatch = await bcrypt.compare(testPassword, user.password);
                        if (isMatch) {
                            foundPassword = testPassword;
                            break;
                        }
                    } catch (error) {
                        // Skip if bcrypt fails
                    }
                }
                
                if (foundPassword) {
                    console.log(`   ✅ Password found: ${foundPassword}`);
                } else {
                    console.log(`   ❌ Password not found in common test passwords`);
                }
                console.log('');
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking user passwords:', error);
        process.exit(1);
    }
}

// Run the check
checkUserPasswords()
    .then(() => {
        console.log('✅ Password check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check passwords:', error);
        process.exit(1);
    });

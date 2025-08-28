// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPlainTextPasswords() {
    const client = await pool.connect();
    
    try {
        console.log('🔐 Scanning for plain text passwords...\n');
        
        // Get all users with their passwords
        const usersQuery = await client.query(
            'SELECT user_id, email, password, user_type FROM users'
        );
        
        if (usersQuery.rows.length === 0) {
            console.log('❌ No users found');
            return;
        }
        
        let plainTextCount = 0;
        let hashedCount = 0;
        let updatedCount = 0;
        
        console.log('📊 Analyzing password storage...');
        console.log('=' .repeat(60));
        
        for (const user of usersQuery.rows) {
            const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
            
            if (isHashed) {
                hashedCount++;
                console.log(`✅ ${user.email} (${user.user_type}) - Already hashed`);
            } else {
                plainTextCount++;
                console.log(`⚠️  ${user.email} (${user.user_type}) - Plain text: "${user.password}"`);
                
                // Hash the plain text password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                
                // Update the password in database
                await client.query(
                    'UPDATE users SET password = $1 WHERE user_id = $2',
                    [hashedPassword, user.user_id]
                );
                
                updatedCount++;
                console.log(`   🔧 Updated to hashed password`);
            }
        }
        
        console.log('\n📈 Summary:');
        console.log('=' .repeat(30));
        console.log(`🔒 Already hashed: ${hashedCount}`);
        console.log(`⚠️  Plain text found: ${plainTextCount}`);
        console.log(`🔧 Updated: ${updatedCount}`);
        console.log(`📊 Total users: ${usersQuery.rows.length}`);
        
        if (updatedCount > 0) {
            console.log('\n✅ All plain text passwords have been hashed!');
            console.log('🔐 Login should now work correctly for all users.');
        } else {
            console.log('\n✅ All passwords are already properly hashed!');
        }
        
    } catch (error) {
        console.error('❌ Error fixing plain text passwords:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    fixPlainTextPasswords()
        .then(() => {
            console.log('\n✅ Password security fix completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Password security fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixPlainTextPasswords };

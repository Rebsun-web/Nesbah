#!/usr/bin/env node

const pool = require('../src/lib/db.cjs');

async function checkTestUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking existing users in database...');
        
        // Get all users
        const result = await client.query(
            'SELECT user_id, email, user_type, password FROM users ORDER BY user_id'
        );
        
        if (result.rowCount === 0) {
            console.log('❌ No users found in the database.');
            return;
        }
        
        console.log(`✅ Found ${result.rowCount} user(s) in the database:`);
        console.log('==========================================');
        
        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.user_id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   User Type: ${user.user_type}`);
            console.log(`   Password (first 20 chars): ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
            console.log(`   Password is hashed: ${user.password && user.password.startsWith('$2b$') ? '✅ Yes' : '❌ No (plain text)'}`);
            console.log('---');
        });
        
        // Check for test/demo users specifically
        const testUsers = result.rows.filter(user => 
            user.email.includes('test') || 
            user.email.includes('demo') || 
            user.email.includes('admin') ||
            user.email.includes('bank')
        );
        
        if (testUsers.length > 0) {
            console.log('\n🎯 Test/Demo Users Found:');
            console.log('========================');
            testUsers.forEach(user => {
                console.log(`• ${user.email} (${user.user_type})`);
            });
        } else {
            console.log('\n⚠️  No obvious test/demo users found.');
        }
        
    } catch (error) {
        console.error('❌ Failed to check users:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the check if this file is executed directly
if (require.main === module) {
    checkTestUsers()
        .then(() => {
            console.log('\n✅ User check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ User check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkTestUsers };

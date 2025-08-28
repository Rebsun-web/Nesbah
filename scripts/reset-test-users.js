#!/usr/bin/env node

const bcrypt = require('bcrypt');
const pool = require('../src/lib/db.cjs');

async function resetTestUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting test user reset...');
        
        // Test users with their passwords
        const testUsers = [
            {
                email: 'admin@test.com',
                password: 'admin123',
                user_type: 'admin_user'
            },
            {
                email: 'bank@test.com',
                password: 'bank123',
                user_type: 'bank_user'
            },
            {
                email: 'business@test.com',
                password: 'business123',
                user_type: 'business_user'
            }
        ];

        await client.query('BEGIN');

        // Delete related records first (in reverse order of dependencies)
        console.log('🗑️  Deleting related records...');
        
        // Delete from tables that reference users
        const tablesToClean = [
            'application_revenue',
            'application_offers', 
            'submitted_applications',
            'pos_application',
            'business_users',
            'bank_users'
        ];
        
        for (const table of tablesToClean) {
            try {
                const deleteResult = await client.query(`DELETE FROM ${table}`);
                console.log(`✅ Deleted ${deleteResult.rowCount} records from ${table}`);
            } catch (error) {
                console.log(`⚠️  Could not delete from ${table}: ${error.message}`);
            }
        }

        // Now delete all users
        console.log('🗑️  Deleting all existing users...');
        const deleteResult = await client.query('DELETE FROM users');
        console.log(`✅ Deleted ${deleteResult.rowCount} existing users`);

        // Create new test users with hashed passwords
        console.log('👥 Creating new test users...');
        
        for (const user of testUsers) {
            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            
            // Create new user
            const result = await client.query(
                'INSERT INTO users (email, password, user_type) VALUES ($1, $2, $3) RETURNING user_id',
                [user.email, hashedPassword, user.user_type]
            );
            
            console.log(`✅ Created ${user.user_type}: ${user.email} (ID: ${result.rows[0].user_id})`);
        }

        await client.query('COMMIT');
        console.log('✅ All test users reset successfully!');
        
        // Print the test credentials for reference
        console.log('\n📋 Test User Credentials:');
        console.log('========================');
        testUsers.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${user.password}`);
            console.log(`User Type: ${user.user_type}`);
            console.log('---');
        });
        
        // Verify the users were created
        console.log('\n🔍 Verifying created users...');
        const verifyResult = await client.query('SELECT user_id, email, user_type FROM users ORDER BY user_id');
        console.log(`✅ Database now contains ${verifyResult.rowCount} user(s):`);
        verifyResult.rows.forEach(user => {
            console.log(`   • ${user.email} (${user.user_type})`);
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to reset test users:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the reset if this file is executed directly
if (require.main === module) {
    resetTestUsers()
        .then(() => {
            console.log('\n✅ Test user reset completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test user reset failed:', error);
            process.exit(1);
        });
}

module.exports = { resetTestUsers };

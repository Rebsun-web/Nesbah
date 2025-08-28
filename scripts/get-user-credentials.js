// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getUserCredentials() {
    const client = await pool.connect();
    
    try {
        console.log('🔐 Extracting user credentials from database...\n');
        
        // Get all users with their credentials
        console.log('👥 ALL USER CREDENTIALS:');
        console.log('=' .repeat(80));
        
        const allUsers = await client.query(`
            SELECT 
                user_id,
                email,
                password,
                user_type,
                account_status,
                verification_status,
                created_at
            FROM users 
            ORDER BY user_type, user_id
        `);
        
        if (allUsers.rows.length === 0) {
            console.log('❌ No users found in the system');
            return;
        }
        
        // Group by user type
        const businessUsers = allUsers.rows.filter(u => u.user_type === 'business_user');
        const bankUsers = allUsers.rows.filter(u => u.user_type === 'bank_user');
        const adminUsers = allUsers.rows.filter(u => u.user_type === 'admin_user');
        const individualUsers = allUsers.rows.filter(u => u.user_type === 'individual_user');
        
        // Display Business Users
        if (businessUsers.length > 0) {
            console.log('\n🏢 BUSINESS USERS:');
            console.log('-'.repeat(50));
            businessUsers.forEach(user => {
                console.log(`📧 Email: ${user.email}`);
                console.log(`🔑 Password: ${user.password}`);
                console.log(`📊 Status: ${user.account_status} | Verified: ${user.verification_status}`);
                console.log(`🆔 User ID: ${user.user_id}`);
                console.log(`📅 Created: ${user.created_at}`);
                console.log('');
            });
        }
        
        // Display Bank Users
        if (bankUsers.length > 0) {
            console.log('\n🏦 BANK USERS:');
            console.log('-'.repeat(50));
            bankUsers.forEach(user => {
                console.log(`📧 Email: ${user.email}`);
                console.log(`🔑 Password: ${user.password}`);
                console.log(`📊 Status: ${user.account_status} | Verified: ${user.verification_status}`);
                console.log(`🆔 User ID: ${user.user_id}`);
                console.log(`📅 Created: ${user.created_at}`);
                console.log('');
            });
        }
        
        // Display Admin Users
        if (adminUsers.length > 0) {
            console.log('\n👨‍💼 ADMIN USERS:');
            console.log('-'.repeat(50));
            adminUsers.forEach(user => {
                console.log(`📧 Email: ${user.email}`);
                console.log(`🔑 Password: ${user.password}`);
                console.log(`📊 Status: ${user.account_status} | Verified: ${user.verification_status}`);
                console.log(`🆔 User ID: ${user.user_id}`);
                console.log(`📅 Created: ${user.created_at}`);
                console.log('');
            });
        }
        
        // Display Individual Users
        if (individualUsers.length > 0) {
            console.log('\n👤 INDIVIDUAL USERS:');
            console.log('-'.repeat(50));
            individualUsers.forEach(user => {
                console.log(`📧 Email: ${user.email}`);
                console.log(`🔑 Password: ${user.password}`);
                console.log(`📊 Status: ${user.account_status} | Verified: ${user.verification_status}`);
                console.log(`🆔 User ID: ${user.user_id}`);
                console.log(`📅 Created: ${user.created_at}`);
                console.log('');
            });
        }
        
        // Summary
        console.log('\n📊 CREDENTIALS SUMMARY:');
        console.log('=' .repeat(50));
        console.log(`🏢 Business Users: ${businessUsers.length}`);
        console.log(`🏦 Bank Users: ${bankUsers.length}`);
        console.log(`👨‍💼 Admin Users: ${adminUsers.length}`);
        console.log(`👤 Individual Users: ${individualUsers.length}`);
        console.log(`📈 Total Users: ${allUsers.rows.length}`);
        
        // Quick reference for login testing
        console.log('\n🚀 QUICK LOGIN REFERENCE:');
        console.log('=' .repeat(50));
        
        if (businessUsers.length > 0) {
            console.log('\n🏢 Business Login (pick any):');
            businessUsers.slice(0, 5).forEach(user => {
                console.log(`   Email: ${user.email} | Password: ${user.password}`);
            });
        }
        
        if (bankUsers.length > 0) {
            console.log('\n🏦 Bank Login (pick any):');
            bankUsers.slice(0, 5).forEach(user => {
                console.log(`   Email: ${user.email} | Password: ${user.password}`);
            });
        }
        
        if (adminUsers.length > 0) {
            console.log('\n👨‍💼 Admin Login:');
            adminUsers.forEach(user => {
                console.log(`   Email: ${user.email} | Password: ${user.password}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error extracting user credentials:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    getUserCredentials()
        .then(() => {
            console.log('\n✅ Credentials extraction completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Credentials extraction failed:', error);
            process.exit(1);
        });
}

module.exports = { getUserCredentials };

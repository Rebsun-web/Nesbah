const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking users in the database...\n');
        
        // Check users table structure
        console.log('📊 Users table structure:');
        const usersStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        usersStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Check all users
        console.log('\n👥 All users in the system:');
        const allUsers = await client.query(`
            SELECT 
                user_id,
                email,
                user_type,
                account_status,
                verification_status,
                created_at,
                last_login_at
            FROM users 
            ORDER BY created_at DESC
        `);
        
        if (allUsers.rows.length === 0) {
            console.log('  No users found in the system');
        } else {
            allUsers.rows.forEach(user => {
                console.log(`  - ID: ${user.user_id} | Email: ${user.email} | Type: ${user.user_type} | Status: ${user.account_status} | Verified: ${user.verification_status} | Last Login: ${user.last_login_at || 'Never'}`);
            });
        }
        
        // Check business users
        console.log('\n🏢 Business users:');
        const businessUsers = await client.query(`
            SELECT 
                bu.user_id,
                u.email,
                bu.trade_name,
                bu.cr_number,
                bu.registration_status,
                bu.is_verified,
                u.created_at
            FROM business_users bu
            JOIN users u ON bu.user_id = u.user_id
            ORDER BY u.created_at DESC
        `);
        
        if (businessUsers.rows.length === 0) {
            console.log('  No business users found');
        } else {
            businessUsers.rows.forEach(user => {
                console.log(`  - ID: ${user.user_id} | Email: ${user.email} | Company: ${user.trade_name} | CR: ${user.cr_number} | Status: ${user.registration_status} | Verified: ${user.is_verified}`);
            });
        }
        
        // Check bank users
        console.log('\n🏦 Bank users:');
        const bankUsers = await client.query(`
            SELECT 
                bu.user_id,
                u.email,
                bu.sama_license_number,
                bu.bank_type,
                bu.license_status,
                bu.is_verified,
                u.created_at
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
            ORDER BY u.created_at DESC
        `);
        
        if (bankUsers.rows.length === 0) {
            console.log('  No bank users found');
        } else {
            bankUsers.rows.forEach(user => {
                console.log(`  - ID: ${user.user_id} | Email: ${user.email} | License: ${user.sama_license_number} | Type: ${user.bank_type} | Status: ${user.license_status} | Verified: ${user.is_verified}`);
            });
        }
        
        // Check individual users
        console.log('\n👤 Individual users:');
        const individualUsers = await client.query(`
            SELECT 
                iu.user_id,
                u.email,
                u.account_status,
                u.verification_status,
                u.created_at
            FROM individual_users iu
            JOIN users u ON iu.user_id = u.user_id
            ORDER BY u.created_at DESC
        `);
        
        if (individualUsers.rows.length === 0) {
            console.log('  No individual users found');
        } else {
            individualUsers.rows.forEach(user => {
                console.log(`  - ID: ${user.user_id} | Email: ${user.email} | Status: ${user.account_status} | Verified: ${user.verification_status}`);
            });
        }
        
        // Check admin users
        console.log('\n👨‍💼 Admin users:');
        const adminUsers = await client.query(`
            SELECT 
                au.admin_id,
                au.email,
                au.role,
                au.is_active,
                au.created_at
            FROM admin_users au
            ORDER BY au.created_at DESC
        `);
        
        if (adminUsers.rows.length === 0) {
            console.log('  No admin users found');
        } else {
            adminUsers.rows.forEach(user => {
                console.log(`  - ID: ${user.admin_id} | Email: ${user.email} | Role: ${user.role} | Active: ${user.is_active}`);
            });
        }
        
        // Summary
        console.log('\n📊 User Summary:');
        console.log(`  Total users: ${allUsers.rows.length}`);
        console.log(`  Business users: ${businessUsers.rows.length}`);
        console.log(`  Bank users: ${bankUsers.rows.length}`);
        console.log(`  Individual users: ${individualUsers.rows.length}`);
        console.log(`  Admin users: ${adminUsers.rows.length}`);
        
    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    checkUsers()
        .then(() => {
            console.log('\n✅ User check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 User check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkUsers };

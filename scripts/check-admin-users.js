const pool = require('../src/lib/db.cjs');

async function checkAdminUsers() {
    console.log('🔍 Checking admin users...');
    
    try {
        const client = await pool.connectWithRetry();
        
        try {
            // Check if admin_users table exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'admin_users'
                );
            `);
            
            if (tableCheck.rows[0].exists) {
                console.log('✅ admin_users table exists');
                
                // Check admin_users table
                const adminUsersResult = await client.query(`
                    SELECT admin_id, email, full_name, role, is_active
                    FROM admin_users
                    ORDER BY admin_id
                `);
                
                if (adminUsersResult.rows.length === 0) {
                    console.log('❌ No admin users found in admin_users table');
                } else {
                    console.log(`✅ Found ${adminUsersResult.rows.length} admin users:`);
                    adminUsersResult.rows.forEach(admin => {
                        console.log(`  - ${admin.email} (${admin.role}) - ${admin.is_active ? 'active' : 'inactive'}`);
                    });
                }
            } else {
                console.log('❌ admin_users table does not exist');
            }
            
            // Check users table for admin users
            console.log('\n📋 Checking users table for admin users:');
            const usersResult = await client.query(`
                SELECT user_id, email, user_type, entity_name
                FROM users
                WHERE user_type = 'admin_user'
                ORDER BY user_id
            `);
            
            if (usersResult.rows.length === 0) {
                console.log('❌ No admin users found in users table');
            } else {
                console.log(`✅ Found ${usersResult.rows.length} admin users in users table:`);
                usersResult.rows.forEach(user => {
                    console.log(`  - ${user.email} (${user.user_type})`);
                });
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking admin users:', error);
        process.exit(1);
    }
}

// Run the check
checkAdminUsers()
    .then(() => {
        console.log('\n✅ Admin users check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check admin users:', error);
        process.exit(1);
    });

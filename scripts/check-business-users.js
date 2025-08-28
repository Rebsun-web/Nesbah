const pool = require('../src/lib/db.cjs');

async function checkBusinessUsers() {
    console.log('🔍 Checking business users in database...');
    
    try {
        const client = await pool.connectWithRetry();
        
        try {
            // Check users table
            console.log('\n📋 Users table:');
            const usersResult = await client.query(`
                SELECT user_id, email, user_type, entity_name, 
                       CASE 
                           WHEN LENGTH(password) > 20 THEN 'hashed'
                           ELSE 'plain_text'
                       END as password_type
                FROM users 
                ORDER BY user_type, email
            `);
            
            if (usersResult.rows.length === 0) {
                console.log('❌ No users found in users table');
            } else {
                console.log(`✅ Found ${usersResult.rows.length} users:`);
                usersResult.rows.forEach(user => {
                    console.log(`  - ${user.email} (${user.user_type}) - ${user.password_type} password`);
                });
            }
            
            // Check business_users table
            console.log('\n📋 Business users table:');
            const businessResult = await client.query(`
                SELECT bu.user_id, bu.cr_national_number, bu.trade_name, bu.registration_status,
                       u.email, u.user_type
                FROM business_users bu
                LEFT JOIN users u ON bu.user_id = u.user_id
                ORDER BY bu.trade_name
            `);
            
            if (businessResult.rows.length === 0) {
                console.log('❌ No business users found in business_users table');
            } else {
                console.log(`✅ Found ${businessResult.rows.length} business users:`);
                businessResult.rows.forEach(business => {
                    console.log(`  - ${business.trade_name} (${business.cr_national_number}) - ${business.registration_status}`);
                    if (business.email) {
                        console.log(`    Email: ${business.email} (${business.user_type})`);
                    } else {
                        console.log(`    No associated user account`);
                    }
                });
            }
            
            // Check bank_users table
            console.log('\n📋 Bank users table:');
            const bankResult = await client.query(`
                SELECT bu.user_id, bu.bank_type, bu.logo_url,
                       u.email, u.user_type
                FROM bank_users bu
                LEFT JOIN users u ON bu.user_id = u.user_id
                ORDER BY bu.bank_type
            `);
            
            if (bankResult.rows.length === 0) {
                console.log('❌ No bank users found in bank_users table');
            } else {
                console.log(`✅ Found ${bankResult.rows.length} bank users:`);
                bankResult.rows.forEach(bank => {
                    console.log(`  - ${bank.bank_type}`);
                    if (bank.email) {
                        console.log(`    Email: ${bank.email} (${bank.user_type})`);
                    } else {
                        console.log(`    No associated user account`);
                    }
                });
            }
            
            // Check for users without login credentials
            console.log('\n🔍 Users without login credentials:');
            const noLoginResult = await client.query(`
                SELECT bu.user_id, bu.trade_name, bu.cr_national_number
                FROM business_users bu
                LEFT JOIN users u ON bu.user_id = u.user_id
                WHERE u.user_id IS NULL
                ORDER BY bu.trade_name
            `);
            
            if (noLoginResult.rows.length === 0) {
                console.log('✅ All business users have login credentials');
            } else {
                console.log(`⚠️ Found ${noLoginResult.rows.length} business users without login credentials:`);
                noLoginResult.rows.forEach(business => {
                    console.log(`  - ${business.trade_name} (${business.cr_national_number})`);
                });
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking business users:', error);
        process.exit(1);
    }
}

// Run the check
checkBusinessUsers()
    .then(() => {
        console.log('\n✅ Business users check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check business users:', error);
        process.exit(1);
    });

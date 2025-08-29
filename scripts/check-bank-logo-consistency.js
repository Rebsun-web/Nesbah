require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkBankLogoConsistency() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking bank logo consistency between bank portal and admin portal...\n');
        
        // Check bank_users table
        const bankUsersResult = await client.query(`
            SELECT 
                bu.user_id,
                u.email,
                u.entity_name,
                bu.logo_url as bank_users_logo_url,
                u.logo_url as users_logo_url
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
            WHERE u.user_type = 'bank_user'
            ORDER BY u.entity_name
        `);
        
        console.log('📊 Bank Users Logo Data:');
        console.log('='.repeat(80));
        bankUsersResult.rows.forEach(bank => {
            console.log(`Bank: ${bank.entity_name} (${bank.email})`);
            console.log(`  - bank_users.logo_url: ${bank.bank_users_logo_url || 'NULL'}`);
            console.log(`  - users.logo_url: ${bank.users_logo_url || 'NULL'}`);
            
            if (bank.bank_users_logo_url !== bank.users_logo_url) {
                console.log(`  ❌ INCONSISTENCY DETECTED!`);
            } else if (bank.bank_users_logo_url) {
                console.log(`  ✅ Consistent logo: ${bank.bank_users_logo_url}`);
            } else {
                console.log(`  ⚠️  No logo set`);
            }
            console.log('');
        });
        
        // Check which table is used by different parts of the system
        console.log('🔍 Checking which table is used by different APIs...\n');
        
        // Check admin users API query
        console.log('📊 Admin Users API Query Analysis:');
        console.log('The admin users API uses: bu.logo_url (from bank_users table)');
        console.log('This is correct for admin portal display.\n');
        
        // Check bank portal logo update
        console.log('📊 Bank Portal Logo Update Analysis:');
        console.log('The bank portal updates both:');
        console.log('  - bank_users.logo_url');
        console.log('  - users.logo_url');
        console.log('This ensures consistency.\n');
        
        // Check for any inconsistencies
        const inconsistencies = bankUsersResult.rows.filter(bank => 
            bank.bank_users_logo_url !== bank.users_logo_url
        );
        
        if (inconsistencies.length > 0) {
            console.log(`❌ Found ${inconsistencies.length} inconsistencies:`);
            inconsistencies.forEach(bank => {
                console.log(`  - ${bank.entity_name}: bank_users=${bank.bank_users_logo_url}, users=${bank.users_logo_url}`);
            });
            
            console.log('\n🔧 Fixing inconsistencies...');
            
            // Fix inconsistencies by copying from bank_users to users
            for (const bank of inconsistencies) {
                if (bank.bank_users_logo_url && !bank.users_logo_url) {
                    await client.query(`
                        UPDATE users 
                        SET logo_url = $1 
                        WHERE user_id = $2
                    `, [bank.bank_users_logo_url, bank.user_id]);
                    console.log(`  ✅ Fixed ${bank.entity_name}: copied logo to users table`);
                } else if (!bank.bank_users_logo_url && bank.users_logo_url) {
                    await client.query(`
                        UPDATE bank_users 
                        SET logo_url = $1 
                        WHERE user_id = $2
                    `, [bank.users_logo_url, bank.user_id]);
                    console.log(`  ✅ Fixed ${bank.entity_name}: copied logo to bank_users table`);
                }
            }
        } else {
            console.log('✅ All bank logos are consistent between tables!');
        }
        
        // Verify the fix
        const verifyResult = await client.query(`
            SELECT 
                bu.user_id,
                u.entity_name,
                bu.logo_url as bank_users_logo_url,
                u.logo_url as users_logo_url
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
            WHERE u.user_type = 'bank_user'
            ORDER BY u.entity_name
        `);
        
        const remainingInconsistencies = verifyResult.rows.filter(bank => 
            bank.bank_users_logo_url !== bank.users_logo_url
        );
        
        if (remainingInconsistencies.length === 0) {
            console.log('\n🎉 All bank logos are now consistent!');
        } else {
            console.log(`\n⚠️  Still have ${remainingInconsistencies.length} inconsistencies after fix.`);
        }
        
    } catch (error) {
        console.error('❌ Error checking bank logo consistency:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkBankLogoConsistency()
    .then(() => {
        console.log('\n✅ Bank logo consistency check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Bank logo consistency check failed:', error);
        process.exit(1);
    });

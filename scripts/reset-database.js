const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🗑️  Starting database reset...');
        console.log('⚠️  This will delete ALL users and data except admin users!');
        
        await client.query('BEGIN');

        // Step 1: Drop all applications and offers data
        console.log('\n📋 Dropping all applications and offers...');
        
        // Clear all application-related tables
        await client.query('DELETE FROM application_revenue');
        await client.query('DELETE FROM application_offers');
        await client.query('DELETE FROM submitted_applications');
        await client.query('DELETE FROM pos_application');
        await client.query('DELETE FROM approved_leads');
        await client.query('DELETE FROM offer_selections');
        await client.query('DELETE FROM status_audit_log');
        await client.query('DELETE FROM bank_application_views');
        await client.query('DELETE FROM bank_offer_submissions');
        await client.query('DELETE FROM time_metrics');
        await client.query('DELETE FROM revenue_collections');
        await client.query('DELETE FROM system_alerts');
        await client.query('DELETE FROM business_intelligence_metrics');
        await client.query('DELETE FROM bank_performance_metrics');
        await client.query('DELETE FROM application_conversion_metrics');
        await client.query('DELETE FROM application_offer_tracking');
        await client.query('DELETE FROM application_rejections');
        await client.query('DELETE FROM auction_deadlines');
        await client.query('DELETE FROM auction_settings');
        await client.query('DELETE FROM offer_status_audit_log');
        await client.query('DELETE FROM submitted_offers');
        await client.query('DELETE FROM user_activity_log');
        await client.query('DELETE FROM creditcard_application');
        await client.query('DELETE FROM loan_application');
        
        console.log('✅ All applications and offers data cleared');

        // Step 2: Drop all non-admin users
        console.log('\n👥 Dropping all non-admin users...');
        
        // Get all non-admin user IDs
        const nonAdminUsers = await client.query(`
            SELECT user_id FROM users 
            WHERE user_type != 'admin_user' 
            AND user_id NOT IN (SELECT admin_id FROM admin_users)
        `);
        
        if (nonAdminUsers.rows.length > 0) {
            console.log(`Found ${nonAdminUsers.rows.length} non-admin users to delete`);
            
            // Delete from specific user tables first (due to foreign key constraints)
            for (const user of nonAdminUsers.rows) {
                await client.query('DELETE FROM business_users WHERE user_id = $1', [user.user_id]);
                await client.query('DELETE FROM bank_users WHERE user_id = $1', [user.user_id]);
            }
            
            // Delete from main users table
            await client.query('DELETE FROM users WHERE user_type != \'admin_user\'');
            
            console.log('✅ All non-admin users deleted');
        } else {
            console.log('ℹ️  No non-admin users found to delete');
        }

        // Step 3: Verify admin users still exist
        console.log('\n👑 Checking admin users...');
        const adminUsers = await client.query('SELECT admin_id, email, full_name, role FROM admin_users');
        
        if (adminUsers.rows.length === 0) {
            console.log('⚠️  No admin users found! Creating default admin...');
            
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            await client.query(`
                INSERT INTO admin_users (email, password_hash, full_name, role, permissions, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                'admin@nesbah.com',
                hashedPassword,
                'System Administrator',
                'super_admin',
                JSON.stringify({all_permissions: true}),
                true
            ]);
            
            console.log('✅ Default admin user created');
        } else {
            console.log(`✅ Found ${adminUsers.rows.length} admin users:`);
            adminUsers.rows.forEach(admin => {
                console.log(`  - ${admin.email} (${admin.role})`);
            });
        }

        // Step 4: Create one business user
        console.log('\n🏢 Creating one business user...');
        
        const bcrypt = require('bcrypt');
        const businessPassword = await bcrypt.hash('business123', 10);
        
        // Create user record
        const businessUserResult = await client.query(`
            INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING user_id
        `, [
            'business@nesbah.com',
            businessPassword,
            'business_user',
            'Tech Solutions Arabia',
            'active'
        ]);
        
        const businessUserId = businessUserResult.rows[0].user_id;
        
        // Create business user record
        await client.query(`
            INSERT INTO business_users (
                user_id, cr_national_number, trade_name, address, sector, 
                registration_status, city, cr_capital, contact_person, contact_person_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            businessUserId,
            'CR4030000001',
            'Tech Solutions Arabia',
            'King Fahd Road, Riyadh',
            'Technology',
            'active',
            'Riyadh',
            500000.00,
            'Ahmed Al-Rashid',
            '+966501234567'
        ]);
        
        console.log('✅ Business user created:');
        console.log(`  Email: business@nesbah.com`);
        console.log(`  Password: business123`);
        console.log(`  Company: Tech Solutions Arabia`);

        // Step 5: Create one bank user
        console.log('\n🏦 Creating one bank user...');
        
        const bankPassword = await bcrypt.hash('bank123', 10);
        
        // Create user record
        const bankUserResult = await client.query(`
            INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING user_id
        `, [
            'bank@nesbah.com',
            bankPassword,
            'bank_user',
            'Saudi National Bank',
            'active'
        ]);
        
        const bankUserId = bankUserResult.rows[0].user_id;
        
        // Create bank user record
        await client.query(`
            INSERT INTO bank_users (
                user_id, email, credit_limit, contact_person, contact_person_number,
                sama_license_number, bank_type, license_status, establishment_date,
                authorized_capital, head_office_address, sama_compliance_status,
                number_of_branches
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            bankUserId,
            'bank@nesbah.com',
            50000.00,
            'Mohammed Al-Zahrani',
            '+966502345678',
            '1000',
            'Commercial Bank',
            'Active',
            '1953-06-20',
            5000000000.00,
            'King Fahd Road, Riyadh, Saudi Arabia',
            'Compliant',
            500
        ]);
        
        console.log('✅ Bank user created:');
        console.log(`  Email: bank@nesbah.com`);
        console.log(`  Password: bank123`);
        console.log(`  Bank: Saudi National Bank`);

        // Step 6: Reset sequences to avoid conflicts
        console.log('\n🔄 Resetting database sequences...');
        
        await client.query('ALTER SEQUENCE user_user_id_seq RESTART WITH 1000');
        await client.query('ALTER SEQUENCE pos_application_application_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE submitted_applications_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE application_offers_offer_id_seq RESTART WITH 1');
        
        console.log('✅ Database sequences reset');

        await client.query('COMMIT');
        
        console.log('\n🎉 Database reset completed successfully!');
        console.log('\n📊 Summary:');
        console.log('  - All applications and offers deleted');
        console.log('  - All non-admin users deleted');
        console.log('  - Admin users preserved');
        console.log('  - 1 business user created');
        console.log('  - 1 bank user created');
        console.log('  - Database sequences reset');
        
        console.log('\n🔑 Login Credentials:');
        console.log('  Admin: admin@nesbah.com / admin123');
        console.log('  Business: business@nesbah.com / business123');
        console.log('  Bank: bank@nesbah.com / bank123');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during database reset:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the reset
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('\n✅ Database reset completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database reset failed:', error);
            process.exit(1);
        });
}

module.exports = { resetDatabase };

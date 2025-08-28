#!/usr/bin/env node

const pool = require('../src/lib/db.cjs');

async function cleanApplications() {
    const client = await pool.connect();
    
    try {
        console.log('🧹 Starting application cleanup...');
        
        await client.query('BEGIN');

        // Get counts before deletion for reporting
        console.log('📊 Getting current application and user counts...');
        
        const submittedAppsCount = await client.query('SELECT COUNT(*) FROM submitted_applications');
        const posAppsCount = await client.query('SELECT COUNT(*) FROM pos_application');
        const offersCount = await client.query('SELECT COUNT(*) FROM application_offers');
        const revenueCount = await client.query('SELECT COUNT(*) FROM application_revenue');
        const businessUsersCount = await client.query('SELECT COUNT(*) FROM business_users');
        const bankUsersCount = await client.query('SELECT COUNT(*) FROM bank_users');
        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        const activityLogCount = await client.query('SELECT COUNT(*) FROM user_activity_log');
        
        console.log(`📈 Current counts:`);
        console.log(`   • Submitted Applications: ${submittedAppsCount.rows[0].count}`);
        console.log(`   • POS Applications: ${posAppsCount.rows[0].count}`);
        console.log(`   • Application Offers: ${offersCount.rows[0].count}`);
        console.log(`   • Application Revenue: ${revenueCount.rows[0].count}`);
        console.log(`   • Business Users: ${businessUsersCount.rows[0].count}`);
        console.log(`   • Bank Users: ${bankUsersCount.rows[0].count}`);
        console.log(`   • Total Users: ${usersCount.rows[0].count}`);
        console.log(`   • User Activity Log: ${activityLogCount.rows[0].count}`);

        // Delete related records first (in reverse order of dependencies)
        console.log('\n🗑️  Deleting application-related records...');
        
        // Delete from tables that reference applications (in dependency order)
        const tablesToClean = [
            'application_revenue',      // References submitted_applications
            'application_offers',       // References submitted_applications
            'submitted_applications',   // References pos_application
            'pos_application',          // Base table
            'user_activity_log',        // References users
            'business_users',           // Business user profiles
            'bank_users'                // Bank user profiles
        ];
        
        let totalDeleted = 0;
        
        for (const table of tablesToClean) {
            try {
                const deleteResult = await client.query(`DELETE FROM ${table}`);
                console.log(`✅ Deleted ${deleteResult.rowCount} records from ${table}`);
                totalDeleted += deleteResult.rowCount;
            } catch (error) {
                console.log(`⚠️  Could not delete from ${table}: ${error.message}`);
            }
        }
        
        // Delete business and bank user accounts (keep admin users)
        console.log('\n🗑️  Deleting business and bank user accounts...');
        try {
            const deleteUsersResult = await client.query(`
                DELETE FROM users 
                WHERE user_type IN ('business_user', 'bank_user')
            `);
            console.log(`✅ Deleted ${deleteUsersResult.rowCount} business/bank user accounts`);
            totalDeleted += deleteUsersResult.rowCount;
        } catch (error) {
            console.log(`⚠️  Could not delete user accounts: ${error.message}`);
        }

        // Verify cleanup
        console.log('\n🔍 Verifying cleanup...');
        
        const finalSubmittedAppsCount = await client.query('SELECT COUNT(*) FROM submitted_applications');
        const finalPosAppsCount = await client.query('SELECT COUNT(*) FROM pos_application');
        const finalOffersCount = await client.query('SELECT COUNT(*) FROM application_offers');
        const finalRevenueCount = await client.query('SELECT COUNT(*) FROM application_revenue');
        const finalBusinessUsersCount = await client.query('SELECT COUNT(*) FROM business_users');
        const finalBankUsersCount = await client.query('SELECT COUNT(*) FROM bank_users');
        const finalActivityLogCount = await client.query('SELECT COUNT(*) FROM user_activity_log');
        
        console.log(`📊 Final counts:`);
        console.log(`   • Submitted Applications: ${finalSubmittedAppsCount.rows[0].count}`);
        console.log(`   • POS Applications: ${finalPosAppsCount.rows[0].count}`);
        console.log(`   • Application Offers: ${finalOffersCount.rows[0].count}`);
        console.log(`   • Application Revenue: ${finalRevenueCount.rows[0].count}`);
        console.log(`   • Business Users: ${finalBusinessUsersCount.rows[0].count}`);
        console.log(`   • Bank Users: ${finalBankUsersCount.rows[0].count}`);
        console.log(`   • User Activity Log: ${finalActivityLogCount.rows[0].count}`);

        await client.query('COMMIT');
        
        console.log('\n✅ Application and user cleanup completed successfully!');
        console.log(`📈 Total records deleted: ${totalDeleted}`);
        
        // Check if there are any remaining users (should only be admin users)
        const remainingUsers = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN user_type = 'business_user' THEN 1 END) as business_users,
                COUNT(CASE WHEN user_type = 'bank_user' THEN 1 END) as bank_users,
                COUNT(CASE WHEN user_type = 'admin_user' THEN 1 END) as admin_users
            FROM users
        `);
        
        const userStats = remainingUsers.rows[0];
        console.log('\n👥 Remaining users in database:');
        console.log(`   • Total Users: ${userStats.total_users}`);
        console.log(`   • Business Users: ${userStats.business_users}`);
        console.log(`   • Bank Users: ${userStats.bank_users}`);
        console.log(`   • Admin Users: ${userStats.admin_users}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to clean applications:', error);
        process.exit(1);
    } finally {
        client.release();
        console.log('\n🔗 Database connection closed');
    }
}

// Run the cleanup
cleanApplications().catch(console.error);

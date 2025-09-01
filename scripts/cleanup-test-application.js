require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanupTestApplication(applicationId) {
    if (!applicationId) {
        console.error('❌ Please provide an application ID to clean up');
        console.log('Usage: node scripts/cleanup-test-application.js <application_id>');
        process.exit(1);
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log(`🧹 Cleaning up test application ${applicationId}...\n`);

        // Get application details before deletion
        const appResult = await client.query(`
            SELECT 
                application_id,
                trade_name,
                status,
                submitted_at,
                auction_end_time
            FROM pos_application 
            WHERE application_id = $1
        `, [applicationId]);

        if (appResult.rows.length === 0) {
            console.log('❌ Application not found');
            return;
        }

        const app = appResult.rows[0];
        console.log('📋 Application details:');
        console.log(`   - ID: ${app.application_id}`);
        console.log(`   - Name: ${app.trade_name}`);
        console.log(`   - Status: ${app.status}`);
        console.log(`   - Submitted: ${app.submitted_at}`);
        console.log(`   - Auction ended: ${app.auction_end_time}`);

        // Confirm deletion
        console.log('\n⚠️  This will permanently delete the test application and all related records.');
        console.log('   Are you sure you want to continue? (y/N)');
        
        // For automated scripts, you can set this environment variable
        const forceDelete = process.env.FORCE_DELETE === 'true';
        
        if (!forceDelete) {
            console.log('   Set FORCE_DELETE=true environment variable to skip confirmation');
            console.log('   Example: FORCE_DELETE=true node scripts/cleanup-test-application.js <id>');
            return;
        }

        console.log('\n🗑️  Proceeding with deletion...');

        // Delete in reverse order of dependencies
        let deletedCount = 0;

        // 1. Delete from application_offer_tracking (if exists)
        try {
            const aotResult = await client.query(`
                DELETE FROM application_offer_tracking 
                WHERE application_id = $1
            `, [applicationId]);
            if (aotResult.rowCount > 0) {
                console.log(`   ✅ Deleted ${aotResult.rowCount} records from application_offer_tracking`);
                deletedCount += aotResult.rowCount;
            }
        } catch (error) {
            console.log(`   ⚠️  Could not delete from application_offer_tracking: ${error.message}`);
        }

        // 2. Delete from submitted_applications
        const saResult = await client.query(`
            DELETE FROM submitted_applications 
            WHERE application_id = $1
        `, [applicationId]);
        console.log(`   ✅ Deleted ${saResult.rowCount} records from submitted_applications`);
        deletedCount += saResult.rowCount;

        // 3. Delete from pos_application
        const paResult = await client.query(`
            DELETE FROM pos_application 
            WHERE application_id = $1
        `, [applicationId]);
        console.log(`   ✅ Deleted ${paResult.rowCount} records from pos_application`);
        deletedCount += paResult.rowCount;

        // 4. Delete from status_audit_log (if exists)
        try {
            const salResult = await client.query(`
                DELETE FROM status_audit_log 
                WHERE application_id = $1
            `, [applicationId]);
            if (salResult.rowCount > 0) {
                console.log(`   ✅ Deleted ${salResult.rowCount} records from status_audit_log`);
                deletedCount += salResult.rowCount;
            }
        } catch (error) {
            console.log(`   ⚠️  Could not delete from status_audit_log: ${error.message}`);
        }

        await client.query('COMMIT');
        
        console.log(`\n🎉 Cleanup completed successfully!`);
        console.log(`📊 Total records deleted: ${deletedCount}`);
        console.log(`🗑️  Test application ${applicationId} has been removed.`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Get application ID from command line arguments
const applicationId = process.argv[2];

if (!applicationId) {
    console.error('❌ Application ID is required');
    console.log('Usage: node scripts/cleanup-test-application.js <application_id>');
    process.exit(1);
}

// Start cleanup
cleanupTestApplication(applicationId)
    .then(() => {
        console.log('\n✅ Cleanup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Cleanup failed:', error);
        process.exit(1);
    });

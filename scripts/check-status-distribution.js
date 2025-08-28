require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkStatusDistribution() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking current status distribution...\n');

        // Check submitted_applications table status distribution
        console.log('📋 submitted_applications table status distribution:');
        const submittedAppsStatus = await client.query(`
            SELECT status, COUNT(*) as count
            FROM submitted_applications
            GROUP BY status
            ORDER BY count DESC
        `);
        
        submittedAppsStatus.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Check pos_application table status distribution
        console.log('\n📋 pos_application table status distribution:');
        const posAppStatus = await client.query(`
            SELECT status, COUNT(*) as count
            FROM pos_application
            GROUP BY status
            ORDER BY count DESC
        `);
        
        posAppStatus.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Check application_offer_tracking table status distribution
        console.log('\n📋 application_offer_tracking table status distribution:');
        const trackingStatus = await client.query(`
            SELECT current_application_status as status, COUNT(DISTINCT application_id) as count
            FROM application_offer_tracking
            GROUP BY current_application_status
            ORDER BY count DESC
        `);
        
        trackingStatus.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Check total applications count
        console.log('\n📊 Total application counts:');
        const totalSubmitted = await client.query('SELECT COUNT(*) as count FROM submitted_applications');
        const totalPos = await client.query('SELECT COUNT(*) as count FROM pos_application');
        const totalTracking = await client.query('SELECT COUNT(DISTINCT application_id) as count FROM application_offer_tracking');
        
        console.log(`  submitted_applications: ${totalSubmitted.rows[0].count}`);
        console.log(`  pos_application: ${totalPos.rows[0].count}`);
        console.log(`  application_offer_tracking (unique): ${totalTracking.rows[0].count}`);

        // Check for status inconsistencies
        console.log('\n🔍 Checking for status inconsistencies...');
        const inconsistencies = await client.query(`
            SELECT 
                sa.application_id,
                sa.status as submitted_status,
                pa.status as pos_status,
                aot.current_application_status as tracking_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE sa.status != pa.status 
               OR (aot.current_application_status IS NOT NULL AND aot.current_application_status != sa.status)
            LIMIT 10
        `);
        
        if (inconsistencies.rows.length > 0) {
            console.log('  ⚠️  Found status inconsistencies:');
            inconsistencies.rows.forEach(row => {
                console.log(`    App ${row.application_id}: submitted=${row.submitted_status}, pos=${row.pos_status}, tracking=${row.tracking_status}`);
            });
        } else {
            console.log('  ✅ No status inconsistencies found');
        }

        // Check what the admin dashboard API is actually returning
        console.log('\n📊 Simulating admin dashboard API query...');
        const dashboardQuery = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        console.log('  Admin dashboard would show:');
        dashboardQuery.rows.forEach(row => {
            console.log(`    ${row.status}: ${row.count}`);
        });

    } catch (error) {
        console.error('❌ Error checking status distribution:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkStatusDistribution();

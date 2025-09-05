const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Fix all application statuses in the database using standardized logic
 */
async function fixApplicationStatuses() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Starting application status correction...');
        
        // Get all applications that need status correction
        const getApplicationsQuery = `
            SELECT 
                application_id,
                status,
                auction_end_time,
                offers_count,
                CASE 
                    WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                    WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                    ELSE 'live_auction'
                END as calculated_status
            FROM pos_application 
            WHERE status != (
                CASE 
                    WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                    WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                    ELSE 'live_auction'
                END
            )
        `;
        
        const applicationsResult = await client.query(getApplicationsQuery);
        console.log(`📊 Found ${applicationsResult.rows.length} applications that need status correction`);
        
        if (applicationsResult.rows.length === 0) {
            console.log('✅ All application statuses are already correct!');
            return;
        }
        
        // Update each application
        let correctedCount = 0;
        for (const app of applicationsResult.rows) {
            const updateQuery = `
                UPDATE pos_application 
                SET 
                    status = $1,
                    updated_at = NOW()
                WHERE application_id = $2
            `;
            
            await client.query(updateQuery, [app.calculated_status, app.application_id]);
            
            console.log(`✅ Updated application ${app.application_id}: ${app.status} → ${app.calculated_status}`);
            correctedCount++;
        }
        
        console.log(`🎉 Successfully corrected ${correctedCount} application statuses!`);
        
        // Verify the correction
        const verifyQuery = `
            SELECT 
                status,
                COUNT(*) as count
            FROM pos_application 
            GROUP BY status
            ORDER BY status
        `;
        
        const verifyResult = await client.query(verifyQuery);
        console.log('\n📈 Current status distribution:');
        verifyResult.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} applications`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing application statuses:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixApplicationStatuses()
        .then(() => {
            console.log('✅ Application status correction completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Application status correction failed:', error);
            process.exit(1);
        });
}

module.exports = { fixApplicationStatuses };

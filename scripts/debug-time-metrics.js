const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nesbah_dev',
    user: 'postgres',
    password: 'password',
});

async function debugTimeMetrics() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Debugging time metrics calculation...');
        
        // Check the actual data
        console.log('\n📊 Application and Offer Timestamps:');
        const timestampData = await client.query(`
            SELECT 
                pa.application_id,
                pa.submitted_at as application_submitted,
                ao.submitted_at as offer_submitted,
                EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/60 as time_diff_minutes,
                EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/3600 as time_diff_hours
            FROM pos_application pa
            JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            WHERE pa.submitted_at IS NOT NULL AND ao.submitted_at IS NOT NULL
            ORDER BY pa.submitted_at DESC
            LIMIT 10
        `);
        
        timestampData.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. App ${row.application_id}:`);
            console.log(`     Application: ${row.application_submitted}`);
            console.log(`     Offer: ${row.offer_submitted}`);
            console.log(`     Time diff: ${row.time_diff_minutes.toFixed(1)} minutes (${row.time_diff_hours.toFixed(1)} hours)`);
        });
        
        // Check the current calculation
        console.log('\n📊 Current Calculation Results:');
        const currentCalculation = await client.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/60) as avg_response_time_minutes,
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/60) as avg_offer_time_minutes
            FROM pos_application pa
            JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            WHERE pa.submitted_at IS NOT NULL AND ao.submitted_at IS NOT NULL
        `);
        
        console.log(`  Average Response Time: ${currentCalculation.rows[0].avg_response_time_minutes?.toFixed(1)} minutes`);
        console.log(`  Average Offer Time: ${currentCalculation.rows[0].avg_offer_time_minutes?.toFixed(1)} minutes`);
        
        // Check if there are any tracking tables that should be used instead
        console.log('\n📊 Checking for tracking tables:');
        const trackingTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%tracking%' OR table_name LIKE '%view%'
            ORDER BY table_name
        `);
        
        if (trackingTables.rows.length > 0) {
            console.log('  Available tracking tables:');
            trackingTables.rows.forEach(row => {
                console.log(`    - ${row.table_name}`);
            });
        } else {
            console.log('  No tracking tables found');
        }
        
        // Check if there are any view/access tracking tables
        console.log('\n📊 Checking for view/access data:');
        const viewTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%view%' OR table_name LIKE '%access%'
            ORDER BY table_name
        `);
        
        if (viewTables.rows.length > 0) {
            console.log('  Available view/access tables:');
            viewTables.rows.forEach(row => {
                console.log(`    - ${row.table_name}`);
            });
        } else {
            console.log('  No view/access tables found');
        }
        
    } catch (error) {
        console.error('❌ Error debugging time metrics:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugTimeMetrics();

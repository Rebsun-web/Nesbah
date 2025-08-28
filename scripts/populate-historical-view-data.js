const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nesbah_dev',
    user: 'postgres',
    password: 'password',
});

async function populateHistoricalViewData() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Populating historical view data for existing offers...');
        
        // Get all existing offers that don't have corresponding view records
        const existingOffers = await client.query(`
            SELECT DISTINCT
                ao.bank_user_id,
                ao.submitted_application_id,
                ao.submitted_at as offer_submitted_at,
                pa.submitted_at as application_submitted_at
            FROM application_offers ao
            JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            LEFT JOIN bank_application_views bav ON 
                ao.bank_user_id = bav.bank_user_id 
                AND ao.submitted_application_id = bav.application_id
            WHERE bav.view_id IS NULL
            ORDER BY ao.submitted_at
        `);
        
        console.log(`📊 Found ${existingOffers.rows.length} offers without view tracking data`);
        
        if (existingOffers.rows.length === 0) {
            console.log('✅ All offers already have view tracking data');
            return;
        }
        
        let populatedCount = 0;
        
        for (const offer of existingOffers.rows) {
            try {
                // Create a reasonable view timestamp (some time before the offer was submitted)
                const offerSubmittedAt = new Date(offer.offer_submitted_at);
                const applicationSubmittedAt = new Date(offer.application_submitted_at);
                
                // Set view time to be between application submission and offer submission
                // Use a random time within that range to simulate realistic viewing patterns
                const timeRange = offerSubmittedAt.getTime() - applicationSubmittedAt.getTime();
                const randomOffset = Math.random() * timeRange * 0.8; // Use 80% of the range
                const viewTime = new Date(applicationSubmittedAt.getTime() + randomOffset);
                
                // Insert view record
                await client.query(`
                    INSERT INTO bank_application_views (
                        bank_user_id,
                        application_id,
                        viewed_at,
                        view_duration_seconds,
                        ip_address,
                        user_agent
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (bank_user_id, application_id) DO NOTHING
                `, [
                    offer.bank_user_id,
                    offer.submitted_application_id,
                    viewTime,
                    Math.floor(Math.random() * 300) + 60, // Random duration between 1-6 minutes
                    '127.0.0.1', // Placeholder IP
                    'Historical Data Migration' // Placeholder user agent
                ]);
                
                // Insert access log record
                await client.query(`
                    INSERT INTO bank_application_access_log (
                        bank_user_id,
                        application_id,
                        action_type,
                        action_timestamp,
                        ip_address,
                        user_agent
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    offer.bank_user_id,
                    offer.submitted_application_id,
                    'view',
                    viewTime,
                    '127.0.0.1',
                    'Historical Data Migration'
                ]);
                
                // Insert offer preparation start record (shortly before offer submission)
                const prepStartTime = new Date(offerSubmittedAt.getTime() - (Math.random() * 30 + 10) * 60 * 1000); // 10-40 minutes before
                await client.query(`
                    INSERT INTO bank_application_access_log (
                        bank_user_id,
                        application_id,
                        action_type,
                        action_timestamp,
                        ip_address,
                        user_agent
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    offer.bank_user_id,
                    offer.submitted_application_id,
                    'offer_preparation_start',
                    prepStartTime,
                    '127.0.0.1',
                    'Historical Data Migration'
                ]);
                
                // Insert offer preparation end record (at offer submission time)
                await client.query(`
                    INSERT INTO bank_application_access_log (
                        bank_user_id,
                        application_id,
                        action_type,
                        action_timestamp,
                        ip_address,
                        user_agent
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    offer.bank_user_id,
                    offer.submitted_application_id,
                    'offer_preparation_end',
                    offerSubmittedAt,
                    '127.0.0.1',
                    'Historical Data Migration'
                ]);
                
                populatedCount++;
                console.log(`✅ Populated data for offer ${offer.submitted_application_id} by bank ${offer.bank_user_id}`);
                
            } catch (error) {
                console.error(`❌ Error populating data for offer ${offer.submitted_application_id}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Successfully populated view tracking data for ${populatedCount} out of ${existingOffers.rows.length} offers`);
        
        // Verify the data
        console.log('\n📊 Verifying populated data...');
        const verificationQuery = await client.query(`
            SELECT 
                COUNT(DISTINCT bav.application_id) as applications_with_views,
                COUNT(DISTINCT bal.application_id) as applications_with_access_logs,
                AVG(EXTRACT(EPOCH FROM (bav.viewed_at - pa.submitted_at))/3600) as avg_response_time_hours,
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - bav.viewed_at))/3600) as avg_offer_time_hours
            FROM pos_application pa
            JOIN bank_application_views bav ON pa.application_id = bav.application_id
            JOIN application_offers ao ON pa.application_id = ao.submitted_application_id 
                AND ao.bank_user_id = bav.bank_user_id
            JOIN bank_application_access_log bal ON pa.application_id = bal.application_id
        `);
        
        const verification = verificationQuery.rows[0];
        console.log(`  Applications with view data: ${verification.applications_with_views}`);
        console.log(`  Applications with access logs: ${verification.applications_with_access_logs}`);
        console.log(`  Average Response Time: ${verification.avg_response_time_hours?.toFixed(2)} hours`);
        console.log(`  Average Offer Time: ${verification.avg_offer_time_hours?.toFixed(2)} hours`);
        
    } catch (error) {
        console.error('❌ Error populating historical view data:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

populateHistoricalViewData();

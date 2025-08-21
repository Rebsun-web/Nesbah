const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function populateTrackingTable() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🚀 Populating application_offer_tracking table with existing data...\n');
        
        // Step 1: Get all bank users
        console.log('📊 Step 1: Getting all bank users...');
        const bankUsers = await client.query(
            'SELECT user_id FROM users WHERE user_type = $1',
            ['bank_user']
        );
        
        console.log(`✅ Found ${bankUsers.rows.length} bank users`);
        
        // Step 2: Get all submitted applications
        console.log('📊 Step 2: Getting all submitted applications...');
        const applications = await client.query(`
            SELECT 
                sa.application_id,
                sa.business_user_id,
                sa.submitted_at,
                sa.purchased_by,
                sa.status as application_status
            FROM submitted_applications sa
            ORDER BY sa.submitted_at
        `);
        
        console.log(`✅ Found ${applications.rows.length} submitted applications`);
        
        // Step 3: Populate tracking table for each application
        console.log('📊 Step 3: Populating tracking table...');
        
        let trackingRecordsCreated = 0;
        let trackingRecordsUpdated = 0;
        
        for (const app of applications.rows) {
            // Calculate application windows
            const applicationWindowStart = new Date(app.submitted_at.getTime() + 48 * 60 * 60 * 1000);
            const applicationWindowEnd = new Date(app.submitted_at.getTime() + 96 * 60 * 60 * 1000);
            
            for (const bankUser of bankUsers.rows) {
                const isPurchased = app.purchased_by && app.purchased_by.includes(bankUser.user_id);
                
                // Check if tracking record already exists
                const existingRecord = await client.query(
                    `SELECT id FROM application_offer_tracking 
                     WHERE application_id = $1 AND bank_user_id = $2`,
                    [app.application_id, bankUser.user_id]
                );
                
                if (existingRecord.rowCount === 0) {
                    // Create new tracking record
                    await client.query(`
                        INSERT INTO application_offer_tracking (
                            application_id,
                            business_user_id,
                            bank_user_id,
                            application_submitted_at,
                            application_window_start,
                            application_window_end,
                            current_application_status
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [
                        app.application_id,
                        app.business_user_id,
                        bankUser.user_id,
                        app.submitted_at,
                        applicationWindowStart,
                        applicationWindowEnd,
                        app.application_status
                    ]);
                    
                    trackingRecordsCreated++;
                } else {
                    // Update existing record
                    await client.query(`
                        UPDATE application_offer_tracking
                        SET 
                            application_submitted_at = $1,
                            application_window_start = $2,
                            application_window_end = $3,
                            current_application_status = $4
                        WHERE application_id = $5 AND bank_user_id = $6
                    `, [
                        app.submitted_at,
                        applicationWindowStart,
                        applicationWindowEnd,
                        app.application_status,
                        app.application_id,
                        bankUser.user_id
                    ]);
                    
                    trackingRecordsUpdated++;
                }
                
                // If this bank purchased the application, update purchase timestamp
                if (isPurchased) {
                    const offerWindowStart = applicationWindowEnd;
                    const offerWindowEnd = new Date(applicationWindowEnd.getTime() + 24 * 60 * 60 * 1000);
                    
                    await client.query(`
                        UPDATE application_offer_tracking
                        SET 
                            purchased_at = $1,
                            current_application_status = 'purchased',
                            offer_window_start = $2,
                            offer_window_end = $3
                        WHERE application_id = $4 AND bank_user_id = $5
                    `, [
                        app.submitted_at, // Use submitted_at as purchase time for existing data
                        offerWindowStart,
                        offerWindowEnd,
                        app.application_id,
                        bankUser.user_id
                    ]);
                }
            }
        }
        
        console.log(`✅ Created ${trackingRecordsCreated} new tracking records`);
        console.log(`✅ Updated ${trackingRecordsUpdated} existing tracking records`);
        
        // Step 4: Populate offer data
        console.log('📊 Step 4: Populating offer data...');
        
        const offers = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_by_user_id,
                ao.submitted_at,
                sa.application_id
            FROM application_offers ao
            JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
        `);
        
        console.log(`✅ Found ${offers.rows.length} offers`);
        
        for (const offer of offers.rows) {
            await client.query(`
                UPDATE application_offer_tracking
                SET 
                    offer_id = $1,
                    offer_sent_at = $2,
                    current_application_status = 'offer_received',
                    current_offer_status = 'submitted'
                WHERE application_id = $3 AND bank_user_id = $4
            `, [
                offer.offer_id,
                offer.submitted_at,
                offer.application_id,
                offer.submitted_by_user_id
            ]);
        }
        
        console.log(`✅ Updated ${offers.rows.length} tracking records with offer data`);
        
        // Step 5: Handle completed applications
        console.log('📊 Step 5: Handling completed applications...');
        
        const completedApplications = await client.query(`
            SELECT 
                sa.application_id,
                sa.status
            FROM submitted_applications sa
            WHERE sa.status = 'completed'
        `);
        
        for (const completed of completedApplications.rows) {
            await client.query(`
                UPDATE application_offer_tracking
                SET current_application_status = 'completed'
                WHERE application_id = $1
            `, [completed.application_id]);
        }
        
        console.log(`✅ Updated ${completedApplications.rows.length} completed applications`);
        
        await client.query('COMMIT');
        console.log('🎉 Tracking table population completed successfully!');
        
        // Summary
        const summary = await client.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN purchased_at IS NOT NULL THEN 1 END) as purchased_records,
                COUNT(CASE WHEN offer_id IS NOT NULL THEN 1 END) as offer_records,
                COUNT(CASE WHEN current_application_status = 'completed' THEN 1 END) as completed_records
            FROM application_offer_tracking
        `);
        
        console.log('\n📊 Tracking Table Summary:');
        console.log(`Total records: ${summary.rows[0].total_records}`);
        console.log(`Purchased records: ${summary.rows[0].purchased_records}`);
        console.log(`Offer records: ${summary.rows[0].offer_records}`);
        console.log(`Completed records: ${summary.rows[0].completed_records}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error populating tracking table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the population
populateTrackingTable()
    .then(() => {
        console.log('✅ Tracking table population is complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Tracking table population failed:', error);
        process.exit(1);
    });

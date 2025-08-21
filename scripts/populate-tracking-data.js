const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function populateTrackingData() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Populating tracking table with existing data...\n');
        
        await client.query('BEGIN');
        
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
                sa.status as application_status,
                sa.auction_end_time,
                sa.offer_selection_end_time
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
            const applicationWindowStart = app.submitted_at;
            const applicationWindowEnd = new Date(app.submitted_at.getTime() + 48 * 60 * 60 * 1000); // 48 hours
            
            for (const bankUser of bankUsers.rows) {
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
                if (app.purchased_by && app.purchased_by.includes(bankUser.user_id)) {
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
                        applicationWindowEnd,
                        new Date(applicationWindowEnd.getTime() + 24 * 60 * 60 * 1000), // 24 hours after application window
                        app.application_id,
                        bankUser.user_id
                    ]);
                }
            }
        }
        
        console.log(`✅ Created ${trackingRecordsCreated} new tracking records`);
        console.log(`✅ Updated ${trackingRecordsUpdated} existing tracking records`);
        
        // Step 4: Update auction timing for existing applications
        console.log('\n📊 Step 4: Updating auction timing for existing applications...');
        
        const updateResult = await client.query(`
            UPDATE submitted_applications 
            SET auction_end_time = submitted_at + INTERVAL '48 hours'
            WHERE auction_end_time IS NULL
        `);
        
        console.log(`✅ Updated auction timing for ${updateResult.rowCount} applications`);
        
        await client.query('COMMIT');
        console.log('\n🎉 Tracking data population completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error populating tracking data:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the population
populateTrackingData()
    .then(() => console.log('\n🎉 Tracking data population completed'))
    .catch(error => console.error('❌ Error:', error));

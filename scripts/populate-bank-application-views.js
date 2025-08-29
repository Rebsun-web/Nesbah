require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function populateBankApplicationViews() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Populating bank_application_views table with existing data...');
        
        // Get all applications that have offers
        const applicationsResult = await client.query(`
            SELECT DISTINCT
                ao.submitted_application_id as application_id,
                ao.bank_user_id,
                u.entity_name as bank_name,
                pa.submitted_at as application_submitted_at,
                ao.submitted_at as offer_submitted_at
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            WHERE u.user_type = 'bank_user'
        `);
        
        console.log(`📊 Found ${applicationsResult.rows.length} applications with offers`);
        
        if (applicationsResult.rows.length > 0) {
            // Insert view records for each application-offer combination
            for (const app of applicationsResult.rows) {
                try {
                    // Create a view timestamp that's before the offer submission
                    const viewTimestamp = new Date(app.offer_submitted_at);
                    viewTimestamp.setMinutes(viewTimestamp.getMinutes() - 5); // 5 minutes before offer
                    
                    await client.query(`
                        INSERT INTO bank_application_views (
                            application_id, 
                            bank_user_id, 
                            bank_name, 
                            viewed_at
                        ) VALUES ($1, $2, $3, $4)
                        ON CONFLICT (application_id, bank_user_id) 
                        DO UPDATE SET 
                            viewed_at = EXCLUDED.viewed_at
                    `, [
                        app.application_id,
                        app.bank_user_id,
                        app.bank_name,
                        viewTimestamp
                    ]);
                    
                    console.log(`✅ Inserted view for application ${app.application_id} by bank ${app.bank_name}`);
                } catch (error) {
                    console.log(`⚠️  Skipped view for application ${app.application_id}: ${error.message}`);
                }
            }
        }
        
        // Now let's check the final count
        const finalCount = await client.query('SELECT COUNT(*) FROM bank_application_views');
        console.log(`📊 Total records in bank_application_views: ${finalCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error populating bank_application_views table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

populateBankApplicationViews()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });

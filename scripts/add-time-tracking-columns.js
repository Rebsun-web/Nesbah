const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addTimeTrackingColumns() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Adding time tracking columns to submitted_applications...');
        
        // Add completion timestamp for applications
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS application_window_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS application_window_ended_at TIMESTAMP
        `);
        
        console.log('✅ Added completion and application window timestamps to submitted_applications');
        
        console.log('🔧 Adding time tracking columns to application_offers...');
        
        // Add timestamps for offers
        await client.query(`
            ALTER TABLE application_offers 
            ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS offer_window_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS offer_window_ended_at TIMESTAMP
        `);
        
        console.log('✅ Added offer acceptance and window timestamps to application_offers');
        
        // Add indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_completed_at 
            ON submitted_applications(completed_at);
            
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_application_window 
            ON submitted_applications(application_window_started_at, application_window_ended_at);
            
            CREATE INDEX IF NOT EXISTS idx_application_offers_accepted_at 
            ON application_offers(offer_accepted_at);
            
            CREATE INDEX IF NOT EXISTS idx_application_offers_window 
            ON application_offers(offer_window_started_at, offer_window_ended_at);
        `);
        
        console.log('✅ Added performance indexes for time tracking columns');
        
        await client.query('COMMIT');
        console.log('🎉 Time tracking columns added successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding time tracking columns:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
addTimeTrackingColumns()
    .then(() => {
        console.log('✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });

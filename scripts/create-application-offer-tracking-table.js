const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createApplicationOfferTrackingTable() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Creating enhanced application_offer_tracking table...');
        
        // Create the comprehensive tracking table with all required fields
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_offer_tracking (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                offer_id INTEGER,
                business_user_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                
                -- Application timestamps (always populated)
                application_submitted_at TIMESTAMP NOT NULL,
                application_window_start TIMESTAMP NOT NULL,
                application_window_end TIMESTAMP NOT NULL,
                
                -- Purchase timestamp (populated when bank purchases)
                purchased_at TIMESTAMP,
                
                -- Offer timestamps (populated when offers are sent/processed)
                offer_sent_at TIMESTAMP,
                offer_accepted_at TIMESTAMP,
                offer_rejected_at TIMESTAMP,
                offer_window_start TIMESTAMP,
                offer_window_end TIMESTAMP,
                
                -- Status tracking
                current_application_status VARCHAR(50) DEFAULT 'purchased',
                current_offer_status VARCHAR(50),
                
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign key constraints
                FOREIGN KEY (application_id) REFERENCES submitted_applications(application_id) ON DELETE CASCADE,
                FOREIGN KEY (offer_id) REFERENCES application_offers(offer_id) ON DELETE SET NULL,
                FOREIGN KEY (business_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (bank_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                
                -- Unique constraint to prevent duplicate tracking entries
                UNIQUE(application_id, bank_user_id)
            )
        `);
        
        console.log('✅ Enhanced application_offer_tracking table created successfully');
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_application_id 
            ON application_offer_tracking(application_id);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_offer_id 
            ON application_offer_tracking(offer_id);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_business_user_id 
            ON application_offer_tracking(business_user_id);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_bank_user_id 
            ON application_offer_tracking(bank_user_id);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_app_status 
            ON application_offer_tracking(current_application_status);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_offer_status 
            ON application_offer_tracking(current_offer_status);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_timestamps 
            ON application_offer_tracking(application_submitted_at, purchased_at, offer_sent_at, offer_accepted_at);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_window_times 
            ON application_offer_tracking(application_window_end, offer_window_end);
        `);
        
        console.log('✅ Performance indexes created successfully');
        
        // Create trigger to update updated_at timestamp
        await client.query(`
            CREATE OR REPLACE FUNCTION update_application_offer_tracking_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_application_offer_tracking_updated_at ON application_offer_tracking;
            
            CREATE TRIGGER update_application_offer_tracking_updated_at
                BEFORE UPDATE ON application_offer_tracking
                FOR EACH ROW
                EXECUTE FUNCTION update_application_offer_tracking_updated_at();
        `);
        
        console.log('✅ Update trigger created successfully');
        
        await client.query('COMMIT');
        console.log('🎉 Enhanced application-offer tracking table setup completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating enhanced application-offer tracking table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the creation
createApplicationOfferTrackingTable()
    .then(() => {
        console.log('✅ Enhanced application-offer tracking table is ready!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Enhanced application-offer tracking table creation failed:', error);
        process.exit(1);
    });

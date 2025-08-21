const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTrackingSystem() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Fixing tracking system issues...\n');
        
        await client.query('BEGIN');
        
        // Step 1: Create application_offer_tracking table without foreign key constraints initially
        console.log('📊 Step 1: Creating application_offer_tracking table...');
        
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
                current_application_status VARCHAR(50) DEFAULT 'submitted',
                current_offer_status VARCHAR(50),
                
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Unique constraint to prevent duplicate tracking entries
                UNIQUE(application_id, bank_user_id)
            )
        `);
        
        console.log('✅ application_offer_tracking table created successfully');
        
        // Step 2: Create indexes for better performance
        console.log('\n📈 Step 2: Creating performance indexes...');
        
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
        
        // Step 3: Create update trigger for updated_at timestamp
        console.log('\n🔄 Step 3: Creating update trigger...');
        
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
        
        // Step 4: Create window calculation functions
        console.log('\n📊 Step 4: Creating window calculation functions...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION calculate_application_windows(submitted_time TIMESTAMP)
            RETURNS TABLE(window_start TIMESTAMP, window_end TIMESTAMP) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    submitted_time AS window_start,
                    submitted_time + INTERVAL '48 hours' AS window_end;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            CREATE OR REPLACE FUNCTION calculate_offer_windows(application_window_end TIMESTAMP)
            RETURNS TABLE(window_start TIMESTAMP, window_end TIMESTAMP) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    application_window_end AS window_start,
                    application_window_end + INTERVAL '24 hours' AS window_end;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Window calculation functions created');
        
        // Step 5: Create application submission tracking function
        console.log('\n📊 Step 5: Creating application submission tracking function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_application_submission()
            RETURNS TRIGGER AS $$
            DECLARE
                window_start TIMESTAMP;
                window_end TIMESTAMP;
                business_user_id INTEGER;
            BEGIN
                -- Get business user ID from the submitted application
                SELECT sa.business_user_id INTO business_user_id
                FROM submitted_applications sa
                WHERE sa.application_id = NEW.application_id;
                
                -- Calculate application windows
                SELECT * INTO window_start, window_end
                FROM calculate_application_windows(NEW.submitted_at);
                
                -- Create tracking record for all bank users
                INSERT INTO application_offer_tracking (
                    application_id,
                    business_user_id,
                    bank_user_id,
                    application_submitted_at,
                    application_window_start,
                    application_window_end,
                    current_application_status
                )
                SELECT 
                    NEW.application_id,
                    business_user_id,
                    u.user_id,
                    NEW.submitted_at,
                    window_start,
                    window_end,
                    'submitted'
                FROM users u
                WHERE u.user_type = 'bank_user'
                ON CONFLICT (application_id, bank_user_id) DO NOTHING;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Application submission tracking function created');
        
        // Step 6: Create application purchase tracking function
        console.log('\n📊 Step 6: Creating application purchase tracking function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_application_purchase()
            RETURNS TRIGGER AS $$
            DECLARE
                window_start TIMESTAMP;
                window_end TIMESTAMP;
                business_user_id INTEGER;
                bank_user_id INTEGER;
            BEGIN
                -- Get business user ID
                SELECT sa.business_user_id INTO business_user_id
                FROM submitted_applications sa
                WHERE sa.application_id = NEW.application_id;
                
                -- Calculate offer windows
                SELECT * INTO window_start, window_end
                FROM calculate_offer_windows(NEW.application_window_end);
                
                -- Update tracking record for each purchasing bank
                FOREACH bank_user_id IN ARRAY NEW.purchased_by
                LOOP
                    UPDATE application_offer_tracking
                    SET 
                        purchased_at = CURRENT_TIMESTAMP,
                        current_application_status = 'purchased',
                        offer_window_start = window_start,
                        offer_window_end = window_end
                    WHERE application_id = NEW.application_id 
                    AND bank_user_id = bank_user_id;
                END LOOP;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Application purchase tracking function created');
        
        // Step 7: Create offer submission tracking function
        console.log('\n📊 Step 7: Creating offer submission tracking function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_offer_submission()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Update tracking record with offer details
                UPDATE application_offer_tracking
                SET 
                    offer_id = NEW.offer_id,
                    offer_sent_at = NEW.submitted_at,
                    current_application_status = 'offer_received',
                    current_offer_status = 'submitted'
                WHERE application_id = (
                    SELECT sa.application_id 
                    FROM submitted_applications sa 
                    WHERE sa.id = NEW.submitted_application_id
                )
                AND bank_user_id = NEW.submitted_by_user_id;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Offer submission tracking function created');
        
        // Step 8: Create triggers
        console.log('\n📊 Step 8: Creating triggers...');
        
        // Trigger for application submission
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_application_submission ON submitted_applications;
            CREATE TRIGGER trigger_application_submission
                AFTER INSERT ON submitted_applications
                FOR EACH ROW
                EXECUTE FUNCTION handle_application_submission();
        `);
        
        // Trigger for application purchase
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_application_purchase ON submitted_applications;
            CREATE TRIGGER trigger_application_purchase
                AFTER UPDATE OF purchased_by ON submitted_applications
                FOR EACH ROW
                WHEN (OLD.purchased_by IS DISTINCT FROM NEW.purchased_by)
                EXECUTE FUNCTION handle_application_purchase();
        `);
        
        // Trigger for offer submission
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_offer_submission ON application_offers;
            CREATE TRIGGER trigger_offer_submission
                AFTER INSERT ON application_offers
                FOR EACH ROW
                EXECUTE FUNCTION handle_offer_submission();
        `);
        
        console.log('✅ All triggers created successfully');
        
        await client.query('COMMIT');
        console.log('\n🎉 Tracking system setup completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing tracking system:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixTrackingSystem()
    .then(() => console.log('\n🎉 Tracking system fix completed'))
    .catch(error => console.error('❌ Error:', error));

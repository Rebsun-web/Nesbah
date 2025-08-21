const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function implementAutomaticTrackingSystem() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🚀 Implementing automatic application-offer tracking system...\n');
        
        // Step 1: Create function to calculate window timestamps
        console.log('📊 Step 1: Creating timestamp calculation functions...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION calculate_application_windows(application_submitted_at TIMESTAMP)
            RETURNS TABLE(window_start TIMESTAMP, window_end TIMESTAMP) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    application_submitted_at + INTERVAL '48 hours' as window_start,
                    application_submitted_at + INTERVAL '96 hours' as window_end;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            CREATE OR REPLACE FUNCTION calculate_offer_windows(application_window_end TIMESTAMP)
            RETURNS TABLE(window_start TIMESTAMP, window_end TIMESTAMP) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    application_window_end as window_start,
                    application_window_end + INTERVAL '24 hours' as window_end;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Timestamp calculation functions created');
        
        // Step 2: Create function to handle application submission tracking
        console.log('📊 Step 2: Creating application submission tracking function...');
        
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
        
        // Step 3: Create function to handle application purchase
        console.log('📊 Step 3: Creating application purchase tracking function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_application_purchase()
            RETURNS TRIGGER AS $$
            DECLARE
                window_start TIMESTAMP;
                window_end TIMESTAMP;
                business_user_id INTEGER;
            BEGIN
                -- Get business user ID
                SELECT sa.business_user_id INTO business_user_id
                FROM submitted_applications sa
                WHERE sa.application_id = NEW.application_id;
                
                -- Calculate offer windows
                SELECT * INTO window_start, window_end
                FROM calculate_offer_windows(NEW.application_window_end);
                
                -- Update tracking record for the purchasing bank
                UPDATE application_offer_tracking
                SET 
                    purchased_at = CURRENT_TIMESTAMP,
                    current_application_status = 'purchased',
                    offer_window_start = window_start,
                    offer_window_end = window_end
                WHERE application_id = NEW.application_id 
                AND bank_user_id = ANY(NEW.purchased_by);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Application purchase tracking function created');
        
        // Step 4: Create function to handle offer submission
        console.log('📊 Step 4: Creating offer submission tracking function...');
        
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
        
        // Step 5: Create function to handle offer selection
        console.log('📊 Step 5: Creating offer selection tracking function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_offer_selection()
            RETURNS TRIGGER AS $$
            DECLARE
                application_id INTEGER;
                selected_bank_id INTEGER;
            BEGIN
                -- Get application ID and selected bank ID
                SELECT 
                    sa.application_id,
                    ao.submitted_by_user_id
                INTO application_id, selected_bank_id
                FROM submitted_applications sa
                JOIN application_offers ao ON sa.id = ao.submitted_application_id
                WHERE ao.offer_id = NEW.selected_offer_id;
                
                -- Mark selected offer as accepted
                UPDATE application_offer_tracking
                SET 
                    offer_accepted_at = CURRENT_TIMESTAMP,
                    current_offer_status = 'deal_won'
                WHERE application_id = application_id
                AND bank_user_id = selected_bank_id;
                
                -- Mark all other offers for this application as rejected
                UPDATE application_offer_tracking
                SET 
                    offer_rejected_at = CURRENT_TIMESTAMP,
                    current_offer_status = 'deal_lost'
                WHERE application_id = application_id
                AND bank_user_id != selected_bank_id
                AND offer_id IS NOT NULL;
                
                -- Update application status to completed
                UPDATE application_offer_tracking
                SET current_application_status = 'completed'
                WHERE application_id = application_id;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Offer selection tracking function created');
        
        // Step 6: Create function to handle application window expiration
        console.log('📊 Step 6: Creating window expiration handling function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_application_window_expiration()
            RETURNS TRIGGER AS $$
            BEGIN
                -- When application window ends, update status for unpurchased applications
                UPDATE application_offer_tracking
                SET current_application_status = 'abandoned'
                WHERE application_id = NEW.application_id
                AND purchased_at IS NULL
                AND application_window_end <= CURRENT_TIMESTAMP;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_offer_window_expiration()
            RETURNS TRIGGER AS $$
            BEGIN
                -- When offer window ends, mark unselected offers as expired
                UPDATE application_offer_tracking
                SET 
                    current_offer_status = 'deal_expired',
                    current_application_status = 'deal_expired'
                WHERE application_id = NEW.application_id
                AND offer_window_end <= CURRENT_TIMESTAMP
                AND offer_accepted_at IS NULL
                AND offer_rejected_at IS NULL;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('✅ Window expiration handling functions created');
        
        // Step 7: Create triggers
        console.log('📊 Step 7: Creating triggers...');
        
        // Trigger for application submission
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_application_submission ON submitted_applications;
            CREATE TRIGGER trigger_application_submission
                AFTER INSERT ON submitted_applications
                FOR EACH ROW
                EXECUTE FUNCTION handle_application_submission();
        `);
        
        // Trigger for application purchase (when purchased_by array is updated)
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
        
        // Trigger for offer selection (assuming offer_selections table exists)
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_offer_selection ON offer_selections;
            CREATE TRIGGER trigger_offer_selection
                AFTER INSERT ON offer_selections
                FOR EACH ROW
                EXECUTE FUNCTION handle_offer_selection();
        `);
        
        // Trigger for application window expiration
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_application_window_expiration ON application_offer_tracking;
            CREATE TRIGGER trigger_application_window_expiration
                AFTER UPDATE ON application_offer_tracking
                FOR EACH ROW
                WHEN (OLD.application_window_end > CURRENT_TIMESTAMP AND NEW.application_window_end <= CURRENT_TIMESTAMP)
                EXECUTE FUNCTION handle_application_window_expiration();
        `);
        
        // Trigger for offer window expiration
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_offer_window_expiration ON application_offer_tracking;
            CREATE TRIGGER trigger_offer_window_expiration
                AFTER UPDATE ON application_offer_tracking
                FOR EACH ROW
                WHEN (OLD.offer_window_end > CURRENT_TIMESTAMP AND NEW.offer_window_end <= CURRENT_TIMESTAMP)
                EXECUTE FUNCTION handle_offer_window_expiration();
        `);
        
        console.log('✅ All triggers created successfully');
        
        // Step 8: Create offer_selections table if it doesn't exist
        console.log('📊 Step 8: Creating offer_selections table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS offer_selections (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                selected_offer_id INTEGER NOT NULL,
                business_user_id INTEGER NOT NULL,
                selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (application_id) REFERENCES submitted_applications(application_id) ON DELETE CASCADE,
                FOREIGN KEY (selected_offer_id) REFERENCES application_offers(offer_id) ON DELETE CASCADE,
                FOREIGN KEY (business_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                
                UNIQUE(application_id)
            )
        `);
        
        console.log('✅ offer_selections table created');
        
        await client.query('COMMIT');
        console.log('🎉 Automatic tracking system implementation completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error implementing automatic tracking system:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the implementation
implementAutomaticTrackingSystem()
    .then(() => {
        console.log('✅ Automatic tracking system is ready!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Automatic tracking system implementation failed:', error);
        process.exit(1);
    });

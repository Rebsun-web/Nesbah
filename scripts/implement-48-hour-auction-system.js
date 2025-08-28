require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function implement48HourAuctionSystem() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔄 Implementing 48-hour auction system and approved leads tracking...\n');

        // Step 1: Create approved_leads table to track bank purchases
        console.log('📋 Creating approved_leads table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS approved_leads (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES pos_application(application_id) ON DELETE CASCADE,
                bank_user_id INTEGER REFERENCES bank_users(user_id) ON DELETE CASCADE,
                purchased_at TIMESTAMP DEFAULT NOW(),
                offer_submitted_at TIMESTAMP,
                offer_device_setup_fee DECIMAL(10,2),
                offer_transaction_fee_mada DECIMAL(5,2),
                offer_transaction_fee_visa_mc DECIMAL(5,2),
                offer_settlement_time_mada INTEGER,
                offer_comment TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        
        console.log('  ✅ Created approved_leads table');

        // Step 2: Update application submission to use live_auction status
        console.log('\n📋 Updating application submission logic...');
        
        // Update existing applications that are still in old statuses
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'live_auction' 
            WHERE status IN ('submitted', 'pending_offers')
        `);
        
        await client.query(`
            UPDATE pos_application 
            SET status = 'live_auction' 
            WHERE status IN ('submitted', 'pending_offers')
        `);
        
        console.log('  ✅ Updated existing applications to live_auction status');

        // Step 3: Set auction end times for all live_auction applications
        console.log('\n📋 Setting auction end times for live_auction applications...');
        
        await client.query(`
            UPDATE submitted_applications sa
            SET auction_end_time = pa.submitted_at + INTERVAL '48 hours'
            FROM pos_application pa
            WHERE sa.application_id = pa.application_id 
            AND sa.status = 'live_auction'
            AND sa.auction_end_time IS NULL
        `);
        
        await client.query(`
            UPDATE pos_application 
            SET auction_end_time = submitted_at + INTERVAL '48 hours'
            WHERE status = 'live_auction'
            AND auction_end_time IS NULL
        `);
        
        console.log('  ✅ Set auction end times for live_auction applications');

        // Step 4: Create status transition function
        console.log('\n📋 Creating status transition function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION transition_application_status()
            RETURNS TRIGGER AS $$
            DECLARE
                offers_count INTEGER;
                auction_expired BOOLEAN;
            BEGIN
                -- Get current offers count and auction status
                SELECT 
                    COALESCE(sa.offers_count, 0),
                    COALESCE(sa.auction_end_time <= NOW(), FALSE)
                INTO offers_count, auction_expired
                FROM submitted_applications sa
                WHERE sa.application_id = NEW.application_id;
                
                -- If auction has expired
                IF auction_expired THEN
                    -- If offers were received, transition to completed
                    IF offers_count > 0 THEN
                        UPDATE submitted_applications 
                        SET status = 'completed' 
                        WHERE application_id = NEW.application_id;
                        
                        UPDATE pos_application 
                        SET status = 'completed' 
                        WHERE application_id = NEW.application_id;
                        
                        -- Update application_offer_tracking if it exists
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'completed',
                            offer_window_start = NOW(),
                            offer_window_end = NOW() + INTERVAL '24 hours'
                        WHERE application_id = NEW.application_id;
                        
                    -- If no offers, transition to ignored
                    ELSE
                        UPDATE submitted_applications 
                        SET status = 'ignored' 
                        WHERE application_id = NEW.application_id;
                        
                        UPDATE pos_application 
                        SET status = 'ignored' 
                        WHERE application_id = NEW.application_id;
                        
                        -- Update application_offer_tracking if it exists
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'ignored'
                        WHERE application_id = NEW.application_id;
                    END IF;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('  ✅ Created status transition function');

        // Step 5: Create trigger for automatic status transitions
        console.log('\n📋 Creating status transition trigger...');
        
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_application_status_transition ON approved_leads;
        `);
        
        await client.query(`
            CREATE TRIGGER trigger_application_status_transition
            AFTER INSERT OR UPDATE ON approved_leads
            FOR EACH ROW
            EXECUTE FUNCTION transition_application_status();
        `);
        
        console.log('  ✅ Created status transition trigger');

        // Step 6: Create function to check and transition expired auctions
        console.log('\n📋 Creating expired auction checker function...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION check_expired_auctions()
            RETURNS INTEGER AS $$
            DECLARE
                expired_count INTEGER := 0;
                app_record RECORD;
            BEGIN
                -- Find applications that have expired and need status transition
                FOR app_record IN 
                    SELECT 
                        sa.application_id,
                        sa.offers_count,
                        sa.auction_end_time
                    FROM submitted_applications sa
                    WHERE sa.status = 'live_auction'
                    AND sa.auction_end_time <= NOW()
                LOOP
                    expired_count := expired_count + 1;
                    
                    -- If offers were received, transition to completed
                    IF app_record.offers_count > 0 THEN
                        UPDATE submitted_applications 
                        SET status = 'completed' 
                        WHERE application_id = app_record.application_id;
                        
                        UPDATE pos_application 
                        SET status = 'completed' 
                        WHERE application_id = app_record.application_id;
                        
                        -- Update application_offer_tracking if it exists
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'completed',
                            offer_window_start = NOW(),
                            offer_window_end = NOW() + INTERVAL '24 hours'
                        WHERE application_id = app_record.application_id;
                        
                    -- If no offers, transition to ignored
                    ELSE
                        UPDATE submitted_applications 
                        SET status = 'ignored' 
                        WHERE application_id = app_record.application_id;
                        
                        UPDATE pos_application 
                        SET status = 'ignored' 
                        WHERE application_id = app_record.application_id;
                        
                        -- Update application_offer_tracking if it exists
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'ignored'
                        WHERE application_id = app_record.application_id;
                    END IF;
                END LOOP;
                
                RETURN expired_count;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        console.log('  ✅ Created expired auction checker function');

        // Step 7: Update status constraints to ensure only valid statuses
        console.log('\n📋 Updating status constraints...');
        
        // Drop existing constraints
        try {
            await client.query('ALTER TABLE submitted_applications DROP CONSTRAINT IF EXISTS submitted_applications_status_check');
            await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
        } catch (err) {
            console.log('  ⚠️  Constraints may not exist, continuing...');
        }

        // Add new constraints
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);

        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        
        console.log('  ✅ Updated status constraints');

        // Step 8: Create indexes for performance
        console.log('\n📋 Creating performance indexes...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_status_auction_end 
            ON submitted_applications(status, auction_end_time)
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_approved_leads_application_bank 
            ON approved_leads(application_id, bank_user_id)
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_approved_leads_purchased_at 
            ON approved_leads(purchased_at)
        `);
        
        console.log('  ✅ Created performance indexes');

        // Step 9: Test the system by running expired auction check
        console.log('\n📋 Testing expired auction checker...');
        
        const expiredCount = await client.query('SELECT check_expired_auctions() as count');
        console.log(`  ✅ Processed ${expiredCount.rows[0].count} expired auctions`);

        await client.query('COMMIT');
        
        console.log('\n✅ 48-hour auction system implemented successfully!');
        
        // Show final status distribution
        console.log('\n📊 Final status distribution:');
        const finalStatus = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        finalStatus.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Show approved leads count
        console.log('\n📊 Approved leads by bank:');
        const approvedLeads = await client.query(`
            SELECT 
                u.entity_name as bank_name,
                COUNT(*) as approved_leads_count
            FROM approved_leads al
            JOIN bank_users bu ON al.bank_user_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            GROUP BY u.entity_name
            ORDER BY approved_leads_count DESC
        `);
        
        if (approvedLeads.rows.length > 0) {
            approvedLeads.rows.forEach(row => {
                console.log(`  ${row.bank_name}: ${row.approved_leads_count} leads`);
            });
        } else {
            console.log('  No approved leads yet');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error implementing 48-hour auction system:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

implement48HourAuctionSystem();

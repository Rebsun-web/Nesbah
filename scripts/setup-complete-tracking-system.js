const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupCompleteTrackingSystem() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Setting up complete application-offer tracking system...\n');
        
        await client.query('BEGIN');
        
        // Step 1: Create the tracking table
        console.log('📊 Step 1: Creating application_offer_tracking table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_offer_tracking (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                offer_id INTEGER,
                business_user_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                
                -- Application timestamps
                application_submitted_at TIMESTAMP NOT NULL,
                application_window_start TIMESTAMP NOT NULL,
                application_window_end TIMESTAMP NOT NULL,
                
                -- Purchase timestamp
                purchased_at TIMESTAMP,
                
                -- Offer timestamps
                offer_sent_at TIMESTAMP,
                offer_accepted_at TIMESTAMP,
                offer_rejected_at TIMESTAMP,
                offer_window_start TIMESTAMP,
                offer_window_end TIMESTAMP,
                
                -- Status tracking
                current_status VARCHAR(50) NOT NULL DEFAULT 'pending',
                
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
        
        console.log('✅ Tracking table created successfully');
        
        // Step 2: Create indexes
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
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_status 
            ON application_offer_tracking(current_status);
            
            CREATE INDEX IF NOT EXISTS idx_app_offer_tracking_timestamps 
            ON application_offer_tracking(application_submitted_at, purchased_at, offer_sent_at, offer_accepted_at);
        `);
        
        console.log('✅ Performance indexes created successfully');
        
        // Step 3: Create update trigger
        console.log('\n🔄 Step 3: Creating update trigger...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
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
                EXECUTE FUNCTION update_updated_at_column();
        `);
        
        console.log('✅ Update trigger created successfully');
        
        // Step 4: Populate with existing data
        console.log('\n🔄 Step 4: Populating tracking table with existing data...');
        
        // Create base tracking entries for all applications
        await client.query(`
            INSERT INTO application_offer_tracking (
                application_id,
                business_user_id,
                application_submitted_at,
                application_window_start,
                application_window_end,
                current_status
            )
            SELECT 
                sa.application_id,
                pa.user_id as business_user_id,
                sa.submitted_at as application_submitted_at,
                sa.submitted_at as application_window_start,
                sa.auction_end_time as application_window_end,
                sa.status as current_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE NOT EXISTS (
                SELECT 1 FROM application_offer_tracking aot 
                WHERE aot.application_id = sa.application_id
            )
        `);
        
        console.log('✅ Created base tracking entries for applications');
        
        // Update with purchase timestamps
        await client.query(`
            UPDATE application_offer_tracking aot
            SET 
                purchased_at = (sa.purchased_by_timestamps ->> aot.bank_user_id::text)::timestamptz,
                current_status = CASE 
                    WHEN (sa.purchased_by_timestamps ->> aot.bank_user_id::text) IS NOT NULL THEN 'purchased'
                    ELSE aot.current_status
                END
            FROM submitted_applications sa
            WHERE aot.application_id = sa.application_id
            AND sa.purchased_by_timestamps IS NOT NULL
            AND sa.purchased_by_timestamps ->> aot.bank_user_id::text IS NOT NULL
        `);
        
        console.log('✅ Updated tracking entries with purchase timestamps');
        
        // Update with offer information
        await client.query(`
            UPDATE application_offer_tracking aot
            SET 
                offer_id = ao.offer_id,
                offer_sent_at = ao.submitted_at,
                offer_window_start = sa.auction_end_time,
                offer_window_end = ao.offer_selection_deadline,
                current_status = CASE 
                    WHEN ao.status = 'deal_won' THEN 'accepted'
                    WHEN ao.status = 'deal_lost' THEN 'rejected'
                    WHEN ao.status = 'submitted' THEN 'offer_sent'
                    ELSE aot.current_status
                END
            FROM application_offers ao
            JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
            WHERE aot.application_id = sa.application_id
            AND aot.bank_user_id = ao.submitted_by_user_id
        `);
        
        console.log('✅ Updated tracking entries with offer information');
        
        // Update acceptance/rejection timestamps
        await client.query(`
            UPDATE application_offer_tracking aot
            SET 
                offer_accepted_at = ao.offer_accepted_at
            FROM application_offers ao
            WHERE aot.offer_id = ao.offer_id
            AND ao.status = 'deal_won'
            AND ao.offer_accepted_at IS NOT NULL
        `);
        
        await client.query(`
            UPDATE application_offer_tracking aot
            SET 
                offer_rejected_at = ao.updated_at
            FROM application_offers ao
            WHERE aot.offer_id = ao.offer_id
            AND ao.status = 'deal_lost'
            AND ao.updated_at IS NOT NULL
        `);
        
        console.log('✅ Updated tracking entries with acceptance/rejection timestamps');
        
        // Create entries for banks that haven't interacted yet
        await client.query(`
            INSERT INTO application_offer_tracking (
                application_id,
                business_user_id,
                bank_user_id,
                application_submitted_at,
                application_window_start,
                application_window_end,
                current_status
            )
            SELECT 
                sa.application_id,
                pa.user_id as business_user_id,
                bu.user_id as bank_user_id,
                sa.submitted_at as application_submitted_at,
                sa.submitted_at as application_window_start,
                sa.auction_end_time as application_window_end,
                'available' as current_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            CROSS JOIN users bu
            WHERE bu.user_type = 'bank_user'
            AND NOT EXISTS (
                SELECT 1 FROM application_offer_tracking aot 
                WHERE aot.application_id = sa.application_id 
                AND aot.bank_user_id = bu.user_id
            )
            AND sa.status IN ('pending_offers', 'offer_received')
        `);
        
        console.log('✅ Created tracking entries for available applications');
        
        // Step 5: Verify the setup
        console.log('\n🔍 Step 5: Verifying setup...');
        
        const totalEntries = await client.query(`
            SELECT COUNT(*) as count FROM application_offer_tracking
        `);
        
        const statusBreakdown = await client.query(`
            SELECT current_status, COUNT(*) as count 
            FROM application_offer_tracking 
            GROUP BY current_status
        `);
        
        const timeMetrics = await client.query(`
            SELECT 
                COUNT(*) as total_tracked,
                COUNT(CASE WHEN purchased_at IS NOT NULL THEN 1 END) as total_purchases,
                COUNT(CASE WHEN offer_sent_at IS NOT NULL THEN 1 END) as total_offers,
                COUNT(CASE WHEN offer_accepted_at IS NOT NULL THEN 1 END) as total_acceptances
            FROM application_offer_tracking
        `);
        
        console.log(`✅ Total tracking entries: ${totalEntries.rows[0].count}`);
        console.log('📊 Status breakdown:');
        statusBreakdown.rows.forEach(row => {
            console.log(`   - ${row.current_status}: ${row.count}`);
        });
        
        console.log('📈 Time tracking metrics:');
        console.log(`   - Total tracked interactions: ${timeMetrics.rows[0].total_tracked}`);
        console.log(`   - Total purchases: ${timeMetrics.rows[0].total_purchases}`);
        console.log(`   - Total offers sent: ${timeMetrics.rows[0].total_offers}`);
        console.log(`   - Total offers accepted: ${timeMetrics.rows[0].total_acceptances}`);
        
        await client.query('COMMIT');
        
        console.log('\n🎉 Complete tracking system setup completed successfully!');
        console.log('\n📋 Summary of time metrics now available:');
        console.log('   • Application Processing Time: Submission to completion');
        console.log('   • Offer Processing Time: Submission to acceptance');
        console.log('   • Bank Response Time: Individual bank purchase to offer submission');
        console.log('   • User Acceptance Time: Offer window start to acceptance');
        console.log('   • Application Auction Windows: 48-hour application auction periods');
        console.log('   • Offer Selection Windows: 24-hour offer selection periods');
        console.log('\n⏰ All times are tracked in HOURS for better precision');
        console.log('\n🔄 The system now tracks each application-bank interaction individually');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error setting up complete tracking system:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the setup
setupCompleteTrackingSystem()
    .then(() => {
        console.log('\n✅ Complete tracking system is ready!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Complete tracking system setup failed:', error);
        process.exit(1);
    });

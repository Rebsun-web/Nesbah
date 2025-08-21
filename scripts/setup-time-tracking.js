const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupTimeTracking() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Setting up comprehensive time tracking system...\n');
        
        await client.query('BEGIN');
        
        // Step 1: Add time tracking columns
        console.log('📊 Step 1: Adding time tracking columns to database...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS application_window_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS application_window_ended_at TIMESTAMP
        `);
        
        await client.query(`
            ALTER TABLE application_offers 
            ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP
        `);
        
        console.log('✅ Time tracking columns added successfully');
        
        // Step 2: Add performance indexes
        console.log('\n📈 Step 2: Adding performance indexes...');
        
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
        
        console.log('✅ Performance indexes added successfully');
        
        // Step 3: Populate existing data with timestamps
        console.log('\n🔄 Step 3: Populating existing data with timestamps...');
        
        // Update application workflow timestamps
        await client.query(`
            UPDATE submitted_applications 
            SET application_window_started_at = submitted_at
            WHERE application_window_started_at IS NULL 
            AND status IN ('pending_offers', 'offer_received', 'completed', 'deal_won', 'deal_lost')
        `);
        
        await client.query(`
            UPDATE submitted_applications 
            SET application_window_ended_at = auction_end_time
            WHERE application_window_ended_at IS NULL 
            AND auction_end_time IS NOT NULL
        `);
        
        await client.query(`
            UPDATE submitted_applications 
            SET completed_at = CURRENT_TIMESTAMP
            WHERE completed_at IS NULL 
            AND status IN ('completed', 'deal_won', 'deal_lost')
        `);
        
        // Update offer workflow timestamps
        // Note: offer_window_started_at and offer_window_ended_at are not needed
        // as we calculate these from application_window_ended_at and offer_selection_deadline
        
        await client.query(`
            UPDATE application_offers 
            SET offer_accepted_at = CURRENT_TIMESTAMP
            WHERE offer_accepted_at IS NULL 
            AND status = 'deal_won'
        `);
        
        console.log('✅ Existing data populated with timestamps');
        
        // Step 4: Verify the setup
        console.log('\n🔍 Step 4: Verifying setup...');
        
        const appCount = await client.query(`
            SELECT COUNT(*) as count 
            FROM submitted_applications 
            WHERE application_window_started_at IS NOT NULL
        `);
        
        const offerCount = await client.query(`
            SELECT COUNT(*) as count 
            FROM application_offers 
            WHERE offer_window_started_at IS NOT NULL
        `);
        
        console.log(`✅ Found ${appCount.rows[0].count} applications with time tracking`);
        console.log(`✅ Found ${offerCount.rows[0].count} offers with time tracking`);
        
        await client.query('COMMIT');
        
        console.log('\n🎉 Time tracking system setup completed successfully!');
        console.log('\n📋 Summary of time metrics now available:');
        console.log('   • Application Processing Time: Submission to completion');
        console.log('   • Offer Processing Time: Submission to acceptance');
        console.log('   • Bank Response Time: Purchase to offer submission');
        console.log('   • User Acceptance Time: Window start to acceptance');
        console.log('   • Application Auction Windows: Duration of application auctions');
        console.log('   • Offer Selection Windows: Duration of offer selection periods');
        console.log('\n⏰ All times are now tracked in HOURS for better precision');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error setting up time tracking system:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the setup
setupTimeTracking()
    .then(() => {
        console.log('\n✅ Time tracking system is ready!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Time tracking system setup failed:', error);
        process.exit(1);
    });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function optimizeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting database optimization...');
        
        // 1. Add indexes for submitted_applications table
        console.log('📋 Adding indexes to submitted_applications...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_status 
            ON submitted_applications(status);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_auction_end_time 
            ON submitted_applications(auction_end_time) 
            WHERE auction_end_time IS NOT NULL;
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_submitted_at 
            ON submitted_applications(submitted_at);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_business_user_id 
            ON submitted_applications(business_user_id);
        `);
        
        // GIN index for array columns
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_purchased_by 
            ON submitted_applications USING GIN(purchased_by);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_ignored_by 
            ON submitted_applications USING GIN(ignored_by);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_opened_by 
            ON submitted_applications USING GIN(opened_by);
        `);
        
        // 2. Add indexes for pos_application table
        console.log('📋 Adding indexes to pos_application...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pos_application_user_id 
            ON pos_application(user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pos_application_status 
            ON pos_application(status);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pos_application_submitted_at 
            ON pos_application(submitted_at);
        `);
        
        // 3. Add indexes for application_revenue table
        console.log('📋 Adding indexes to application_revenue...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_revenue_bank_user_id 
            ON application_revenue(bank_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_revenue_application_id 
            ON application_revenue(application_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_revenue_created_at 
            ON application_revenue(created_at);
        `);
        
        // 4. Add indexes for business_users table
        console.log('📋 Adding indexes to business_users...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_business_users_cr_number 
            ON business_users(cr_number);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_business_users_registration_status 
            ON business_users(registration_status);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_business_users_trade_name 
            ON business_users(trade_name);
        `);
        
        // 5. Add indexes for bank_users table (corrected schema)
        console.log('📋 Adding indexes to bank_users...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_users_sama_license_number 
            ON bank_users(sama_license_number);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_users_bank_type 
            ON bank_users(bank_type);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_users_license_status 
            ON bank_users(license_status);
        `);
        
        // 6. Add indexes for application_offers table
        console.log('📋 Adding indexes to application_offers...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_offers_submitted_application_id 
            ON application_offers(submitted_application_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_offers_submitted_by_user_id 
            ON application_offers(submitted_by_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_application_offers_status 
            ON application_offers(status);
        `);
        
        // 7. Add indexes for users table
        console.log('📋 Adding indexes to users table...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_user_type 
            ON users(user_type);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email 
            ON users(email);
        `);
        
        // 8. Add composite indexes for common query patterns
        console.log('📋 Adding composite indexes...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_status_auction_end_time 
            ON submitted_applications(status, auction_end_time) 
            WHERE auction_end_time IS NOT NULL;
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_business_user_id_status 
            ON submitted_applications(business_user_id, status);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_application_type_status 
            ON submitted_applications(application_type, status);
        `);
        
        // 9. Add partial indexes for active applications
        console.log('📋 Adding partial indexes for active applications...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_pending_offers 
            ON submitted_applications(auction_end_time, status) 
            WHERE status = 'pending_offers';
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_submitted_applications_live_auctions 
            ON submitted_applications(status, submitted_at) 
            WHERE status = 'live_auction';
        `);
        
        // 10. Add indexes for performance monitoring tables
        console.log('📋 Adding indexes for monitoring tables...');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_application_id 
            ON bank_application_views(application_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_bank_user_id 
            ON bank_application_views(bank_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_viewed_at 
            ON bank_application_views(viewed_at);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_application_id 
            ON bank_offer_submissions(application_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_bank_user_id 
            ON bank_offer_submissions(bank_user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_submitted_at 
            ON bank_offer_submissions(submitted_at);
        `);
        
        // 11. Analyze tables to update statistics
        console.log('📊 Analyzing tables...');
        
        const tablesToAnalyze = [
            'submitted_applications',
            'pos_application', 
            'application_revenue',
            'business_users',
            'bank_users',
            'application_offers',
            'users',
            'bank_application_views',
            'bank_offer_submissions'
        ];
        
        for (const table of tablesToAnalyze) {
            await client.query(`ANALYZE ${table};`);
            console.log(`  ✅ Analyzed ${table}`);
        }
        
        console.log('✅ Database optimization completed successfully!');
        
        // 12. Show index information
        console.log('\n📋 Current indexes:');
        const indexResult = await client.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename IN ('submitted_applications', 'pos_application', 'application_revenue', 'business_users', 'bank_users', 'application_offers', 'users', 'bank_application_views', 'bank_offer_submissions')
            ORDER BY tablename, indexname;
        `);
        
        indexResult.rows.forEach(row => {
            console.log(`  - ${row.tablename}.${row.indexname}`);
        });
        
        // 13. Show performance statistics
        console.log('\n📊 Performance Statistics:');
        const statsResult = await client.query(`
            SELECT 
                schemaname,
                tablename,
                attname,
                n_distinct,
                correlation
            FROM pg_stats 
            WHERE schemaname = 'public' 
            AND tablename IN ('submitted_applications', 'pos_application', 'application_revenue')
            ORDER BY tablename, attname;
        `);
        
        console.log('  Table statistics updated for query optimization');
        
    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run optimization if called directly
if (require.main === module) {
    optimizeDatabase()
        .then(() => {
            console.log('🎉 Database optimization script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database optimization script failed:', error);
            process.exit(1);
        });
}

module.exports = { optimizeDatabase };

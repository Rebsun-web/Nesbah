// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAnalyticsTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing analytics tables...\n');
        
        // Drop existing tables if they exist
        console.log('🗑️  Dropping existing tables...');
        await client.query('DROP TABLE IF EXISTS time_metrics CASCADE');
        await client.query('DROP TABLE IF EXISTS bank_offer_submissions CASCADE');
        await client.query('DROP TABLE IF EXISTS bank_application_views CASCADE');
        console.log('✅ Existing tables dropped');

        // Create bank_application_views table
        console.log('📊 Creating bank_application_views table...');
        await client.query(`
            CREATE TABLE bank_application_views (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                viewed_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ bank_application_views table created');

        // Create bank_offer_submissions table
        console.log('📊 Creating bank_offer_submissions table...');
        await client.query(`
            CREATE TABLE bank_offer_submissions (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                offer_id INTEGER,
                submitted_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ bank_offer_submissions table created');

        // Create time_metrics table
        console.log('📊 Creating time_metrics table...');
        await client.query(`
            CREATE TABLE time_metrics (
                id SERIAL PRIMARY KEY,
                bank_user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                metric_value DECIMAL(10,2),
                metric_unit VARCHAR(20),
                calculation_date DATE DEFAULT CURRENT_DATE,
                total_applications INTEGER DEFAULT 0,
                applications_with_offers INTEGER DEFAULT 0,
                conversion_rate DECIMAL(5,2),
                avg_response_time_minutes DECIMAL(10,2),
                avg_offer_submission_time_minutes DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(bank_user_id, metric_type, calculation_date)
            )
        `);
        console.log('✅ time_metrics table created');

        // Create indexes one by one
        console.log('📊 Creating indexes...');
        
        // Indexes for bank_application_views
        await client.query('CREATE INDEX idx_bank_application_views_app_id ON bank_application_views(application_id)');
        await client.query('CREATE INDEX idx_bank_application_views_bank_id ON bank_application_views(bank_user_id)');
        await client.query('CREATE INDEX idx_bank_application_views_viewed_at ON bank_application_views(viewed_at)');
        console.log('✅ Indexes created for bank_application_views');

        // Indexes for bank_offer_submissions
        await client.query('CREATE INDEX idx_bank_offer_submissions_app_id ON bank_offer_submissions(application_id)');
        await client.query('CREATE INDEX idx_bank_offer_submissions_bank_id ON bank_offer_submissions(bank_user_id)');
        await client.query('CREATE INDEX idx_bank_offer_submissions_submitted_at ON bank_offer_submissions(submitted_at)');
        console.log('✅ Indexes created for bank_offer_submissions');

        // Indexes for time_metrics
        await client.query('CREATE INDEX idx_time_metrics_bank_id ON time_metrics(bank_user_id)');
        await client.query('CREATE INDEX idx_time_metrics_calculation_date ON time_metrics(calculation_date)');
        await client.query('CREATE INDEX idx_time_metrics_metric_type ON time_metrics(metric_type)');
        console.log('✅ Indexes created for time_metrics');

        // Create the calculation function
        console.log('📊 Creating time metrics calculation function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION calculate_bank_time_metrics()
            RETURNS void AS $$
            DECLARE
                bank_record RECORD;
                avg_response_time DECIMAL(10,2);
                avg_offer_time DECIMAL(10,2);
                total_apps INTEGER;
                apps_with_offers INTEGER;
                conversion_rate DECIMAL(5,2);
            BEGIN
                -- Loop through all bank users
                FOR bank_record IN 
                    SELECT DISTINCT u.user_id, u.entity_name as bank_name
                    FROM users u 
                    WHERE u.user_type = 'bank_user'
                LOOP
                    -- Calculate average response time (time to view application)
                    SELECT AVG(EXTRACT(EPOCH FROM (bav.viewed_at - a.auction_start_time)) / 60)
                    INTO avg_response_time
                    FROM bank_application_views bav
                    JOIN submitted_applications a ON bav.application_id = a.application_id
                    WHERE bav.bank_user_id = bank_record.user_id
                    AND a.auction_start_time IS NOT NULL;

                    -- Calculate average offer submission time
                    SELECT AVG(EXTRACT(EPOCH FROM (bos.submitted_at - bav.viewed_at)) / 60)
                    INTO avg_offer_time
                    FROM bank_offer_submissions bos
                    JOIN bank_application_views bav ON bos.application_id = bav.application_id 
                        AND bos.bank_user_id = bav.bank_user_id
                    WHERE bos.bank_user_id = bank_record.user_id;

                    -- Calculate total applications viewed by this bank
                    SELECT COUNT(DISTINCT application_id)
                    INTO total_apps
                    FROM bank_application_views
                    WHERE bank_user_id = bank_record.user_id;

                    -- Calculate applications with offers submitted
                    SELECT COUNT(DISTINCT application_id)
                    INTO apps_with_offers
                    FROM bank_offer_submissions
                    WHERE bank_user_id = bank_record.user_id;

                    -- Calculate conversion rate
                    IF total_apps > 0 THEN
                        conversion_rate := (apps_with_offers::DECIMAL / total_apps::DECIMAL) * 100;
                    ELSE
                        conversion_rate := 0;
                    END IF;

                    -- Insert or update time metrics
                    INSERT INTO time_metrics (
                        bank_user_id, bank_name, metric_type, 
                        avg_response_time_minutes, avg_offer_submission_time_minutes,
                        total_applications, applications_with_offers, conversion_rate
                    ) VALUES (
                        bank_record.user_id, bank_record.bank_name, 'daily_metrics',
                        COALESCE(avg_response_time, 0), COALESCE(avg_offer_time, 0),
                        total_apps, apps_with_offers, conversion_rate
                    )
                    ON CONFLICT (bank_user_id, metric_type, calculation_date)
                    DO UPDATE SET
                        avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
                        avg_offer_submission_time_minutes = EXCLUDED.avg_offer_submission_time_minutes,
                        total_applications = EXCLUDED.total_applications,
                        applications_with_offers = EXCLUDED.applications_with_offers,
                        conversion_rate = EXCLUDED.conversion_rate,
                        updated_at = NOW();

                END LOOP;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Time metrics calculation function created');

        // Create cleanup function
        console.log('📊 Creating cleanup function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION cleanup_auction_tracking_data()
            RETURNS void AS $$
            BEGIN
                -- Delete tracking data for completed auctions
                DELETE FROM bank_application_views 
                WHERE application_id IN (
                    SELECT application_id 
                    FROM submitted_applications 
                    WHERE status IN ('complete', 'ignored') 
                    AND auction_end_time < NOW() - INTERVAL '1 day'
                );

                DELETE FROM bank_offer_submissions 
                WHERE application_id IN (
                    SELECT application_id 
                    FROM submitted_applications 
                    WHERE status IN ('complete', 'ignored') 
                    AND auction_end_time < NOW() - INTERVAL '1 day'
                );
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Cleanup function created');

        console.log('\n🎉 All analytics tables and functions created successfully!');

    } catch (error) {
        console.error('❌ Error fixing analytics tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    fixAnalyticsTables()
        .then(() => {
            console.log('\n✅ Analytics tables fix completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Analytics tables fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAnalyticsTables };

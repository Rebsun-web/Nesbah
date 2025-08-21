const pool = require('./db.cjs');

async function runAdminMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('🔄 Starting Admin Panel Database Migrations...');

        // 1. Create status_audit_log table for tracking manual status transitions
        console.log('📝 Creating status_audit_log table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS status_audit_log (
                log_id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                from_status VARCHAR(20) NOT NULL,
                to_status VARCHAR(20) NOT NULL,
                admin_user_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_status_audit_application 
                    FOREIGN KEY (application_id) REFERENCES submitted_applications(id) ON DELETE CASCADE
            );
        `);

        // 2. Create auction_deadlines table for tracking deadline extensions
        console.log('⏰ Creating auction_deadlines table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS auction_deadlines (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                phase VARCHAR(20) NOT NULL CHECK (phase IN ('auction', 'selection')),
                original_deadline TIMESTAMP NOT NULL,
                extended_deadline TIMESTAMP NOT NULL,
                extension_reason TEXT NOT NULL,
                admin_user_id INTEGER NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_auction_deadlines_application 
                    FOREIGN KEY (application_id) REFERENCES submitted_applications(id) ON DELETE CASCADE
            );
        `);

        // 3. Create offer_status_audit_log table for offer status tracking
        console.log('💰 Creating offer_status_audit_log table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS offer_status_audit_log (
                log_id SERIAL PRIMARY KEY,
                offer_id INTEGER NOT NULL,
                application_id INTEGER NOT NULL,
                from_status VARCHAR(20) NOT NULL,
                to_status VARCHAR(20) NOT NULL,
                admin_user_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_offer_audit_offer 
                    FOREIGN KEY (offer_id) REFERENCES application_offers(offer_id) ON DELETE CASCADE,
                CONSTRAINT fk_offer_audit_application 
                    FOREIGN KEY (application_id) REFERENCES submitted_applications(id) ON DELETE CASCADE
            );
        `);

        // 4. Create admin_audit_log table for general admin actions
        console.log('🔍 Creating admin_audit_log table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                log_id SERIAL PRIMARY KEY,
                action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'DEADLINE_EXTEND')),
                table_name VARCHAR(50) NOT NULL,
                record_id INTEGER NOT NULL,
                admin_user_id INTEGER NOT NULL,
                details JSONB,
                timestamp TIMESTAMP DEFAULT NOW()
            );
        `);

        // 5. Create revenue_collections table for detailed revenue tracking
        console.log('💵 Creating revenue_collections table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS revenue_collections (
                collection_id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'failed', 'refunded')),
                transaction_reference VARCHAR(100),
                collection_method VARCHAR(20) DEFAULT 'bank_purchase',
                notes TEXT,
                timestamp TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_revenue_collections_application 
                    FOREIGN KEY (application_id) REFERENCES submitted_applications(id) ON DELETE CASCADE,
                CONSTRAINT fk_revenue_collections_bank 
                    FOREIGN KEY (bank_user_id) REFERENCES bank_users(user_id) ON DELETE CASCADE
            );
        `);

        // 6. Create admin_users table for admin authentication
        console.log('👤 Creating admin_users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                admin_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'read_only')),
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                mfa_enabled BOOLEAN DEFAULT false,
                mfa_secret VARCHAR(255),
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 7. Create system_alerts table for monitoring and notifications
        console.log('🚨 Creating system_alerts table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_alerts (
                alert_id SERIAL PRIMARY KEY,
                alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('deadline_approaching', 'payment_failure', 'system_error', 'revenue_anomaly', 'user_limit_reached')),
                severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                related_entity_type VARCHAR(50),
                related_entity_id INTEGER,
                is_resolved BOOLEAN DEFAULT false,
                resolved_by INTEGER,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_system_alerts_resolved_by 
                    FOREIGN KEY (resolved_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
            );
        `);

        // 8. Create business_intelligence_metrics table for BI reporting
        console.log('📊 Creating business_intelligence_metrics table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_intelligence_metrics (
                metric_id SERIAL PRIMARY KEY,
                metric_name VARCHAR(100) NOT NULL,
                metric_value DECIMAL(15,4) NOT NULL,
                metric_unit VARCHAR(20),
                calculation_date DATE NOT NULL,
                time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
                category VARCHAR(50) NOT NULL CHECK (category IN ('revenue', 'conversion', 'engagement', 'performance')),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(metric_name, calculation_date, time_period)
            );
        `);

        // 9. Add indexes for performance optimization
        console.log('⚡ Creating performance indexes...');
        
        // Status audit log indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_status_audit_application_id ON status_audit_log(application_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_status_audit_timestamp ON status_audit_log(timestamp);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_status_audit_admin ON status_audit_log(admin_user_id);');

        // Auction deadlines indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_auction_deadlines_application ON auction_deadlines(application_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_auction_deadlines_phase ON auction_deadlines(phase);');

        // Offer status audit indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_offer_audit_offer_id ON offer_status_audit_log(offer_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_offer_audit_application ON offer_status_audit_log(application_id);');

        // Revenue collections indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_revenue_collections_application ON revenue_collections(application_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_revenue_collections_bank ON revenue_collections(bank_user_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_revenue_collections_status ON revenue_collections(status);');

        // System alerts indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved);');

        // Business intelligence indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_bi_metrics_date ON business_intelligence_metrics(calculation_date);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_bi_metrics_category ON business_intelligence_metrics(category);');

        // 10. Add missing columns to existing tables if they don't exist
        console.log('🔧 Adding missing columns to existing tables...');

        // Add admin-specific columns to submitted_applications
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
            ADD COLUMN IF NOT EXISTS last_admin_action TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_admin_user_id INTEGER,
            ADD COLUMN IF NOT EXISTS assigned_user_id INTEGER;
        `);

        // Add admin-specific columns to application_offers
        await client.query(`
            ALTER TABLE application_offers 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS featured_reason TEXT;
        `);

        // Add admin-specific columns to user tables
        await client.query(`
            ALTER TABLE business_users 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
        `);

        await client.query(`
            ALTER TABLE individual_users 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
        `);

        await client.query(`
            ALTER TABLE bank_users 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT 1000.00;
        `);

        // 11. Insert default admin user (password should be changed in production)
        console.log('👑 Creating default admin user...');
        await client.query(`
            INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
            VALUES (
                'admin@nesbah.com',
                '$2b$12$WIShkZepmqGjd9rxIbCUhuFX4E2FSwHbv0NiB/cpEc6rh2S4lYZwm',
                'System Administrator',
                'super_admin',
                '{"all_permissions": true}'
            )
            ON CONFLICT (email) DO NOTHING;
        `);

        // 12. Create views for common admin queries
        console.log('👁️ Creating admin views...');

        // View for applications requiring attention
        await client.query(`
            CREATE OR REPLACE VIEW admin_urgent_applications AS
            SELECT 
                sa.application_id,
                sa.status,
                sa.auction_end_time,
                sa.offer_selection_end_time,
                sa.offers_count,
                sa.revenue_collected,
                pa.submitted_at,
                pa.trade_name,
                EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_auction_end,
                EXTRACT(EPOCH FROM (sa.offer_selection_end_time - NOW()))/3600 as hours_until_selection_end,
                CASE 
                    WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                    WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                    WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 'auction_expired'
                    WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                    ELSE 'normal'
                END as urgency_level
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE 
                (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour')
                OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour')
                OR (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW())
                OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW());
        `);

        // View for revenue summary
        await client.query(`
            CREATE OR REPLACE VIEW admin_revenue_summary AS
            SELECT 
                DATE(rc.timestamp) as collection_date,
                COUNT(*) as total_collections,
                SUM(rc.amount) as total_revenue,
                AVG(rc.amount) as avg_revenue_per_collection,
                COUNT(CASE WHEN rc.status = 'collected' THEN 1 END) as successful_collections,
                COUNT(CASE WHEN rc.status = 'failed' THEN 1 END) as failed_collections,
                COUNT(CASE WHEN rc.status = 'pending' THEN 1 END) as pending_collections
            FROM revenue_collections rc
            GROUP BY DATE(rc.timestamp)
            ORDER BY collection_date DESC;
        `);

        await client.query('COMMIT');
        console.log('✅ Admin Panel Database Migrations completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Admin Panel Database Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to run the migration
async function runAdminMigration() {
    try {
        await runAdminMigrations();
        console.log('🎉 Admin Panel database schema is ready!');
    } catch (error) {
        console.error('💥 Failed to run admin migrations:', error);
        process.exit(1);
    }
}

// Export for use in other files
module.exports = { runAdminMigration };

// Run migration if this file is executed directly
if (require.main === module) {
    runAdminMigration();
}

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nesbah_dev',
    user: 'postgres',
    password: 'password',
});

async function createViewTrackingTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating view tracking and access logging tables...');
        
        // Create bank_application_views table to track when banks view applications
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_application_views (
                view_id SERIAL PRIMARY KEY,
                bank_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                application_id INTEGER NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
                viewed_at TIMESTAMP DEFAULT NOW(),
                view_duration_seconds INTEGER DEFAULT 0,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(bank_user_id, application_id)
            )
        `);
        console.log('✅ Created bank_application_views table');
        
        // Create bank_application_access_log table for detailed access tracking
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_application_access_log (
                log_id SERIAL PRIMARY KEY,
                bank_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                application_id INTEGER NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
                action_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'offer_preparation_start', 'offer_preparation_end'
                action_timestamp TIMESTAMP DEFAULT NOW(),
                session_id VARCHAR(255),
                ip_address INET,
                user_agent TEXT,
                additional_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Created bank_application_access_log table');
        
        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_bank_views_bank_user_id ON bank_application_views(bank_user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_bank_views_application_id ON bank_application_views(application_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_bank_views_viewed_at ON bank_application_views(viewed_at)');
        
        await client.query('CREATE INDEX IF NOT EXISTS idx_access_log_bank_user_id ON bank_application_access_log(bank_user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_access_log_application_id ON bank_application_access_log(application_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_access_log_action_timestamp ON bank_application_access_log(action_timestamp)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_access_log_action_type ON bank_application_access_log(action_type)');
        
        console.log('✅ Created indexes for view tracking tables');
        
        // Create a function to record application views
        await client.query(`
            CREATE OR REPLACE FUNCTION record_application_view(
                p_bank_user_id INTEGER,
                p_application_id INTEGER,
                p_ip_address INET DEFAULT NULL,
                p_user_agent TEXT DEFAULT NULL
            ) RETURNS INTEGER AS $$
            DECLARE
                v_view_id INTEGER;
            BEGIN
                INSERT INTO bank_application_views (
                    bank_user_id, 
                    application_id, 
                    ip_address, 
                    user_agent
                ) VALUES (
                    p_bank_user_id, 
                    p_application_id, 
                    p_ip_address, 
                    p_user_agent
                )
                ON CONFLICT (bank_user_id, application_id) 
                DO UPDATE SET 
                    viewed_at = NOW(),
                    ip_address = COALESCE(p_ip_address, bank_application_views.ip_address),
                    user_agent = COALESCE(p_user_agent, bank_application_views.user_agent)
                RETURNING view_id INTO v_view_id;
                
                -- Also log the access
                INSERT INTO bank_application_access_log (
                    bank_user_id, 
                    application_id, 
                    action_type, 
                    ip_address, 
                    user_agent
                ) VALUES (
                    p_bank_user_id, 
                    p_application_id, 
                    'view', 
                    p_ip_address, 
                    p_user_agent
                );
                
                RETURN v_view_id;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Created record_application_view function');
        
        // Create a function to record offer preparation start
        await client.query(`
            CREATE OR REPLACE FUNCTION record_offer_preparation_start(
                p_bank_user_id INTEGER,
                p_application_id INTEGER,
                p_session_id VARCHAR(255) DEFAULT NULL
            ) RETURNS INTEGER AS $$
            DECLARE
                v_log_id INTEGER;
            BEGIN
                INSERT INTO bank_application_access_log (
                    bank_user_id, 
                    application_id, 
                    action_type, 
                    session_id
                ) VALUES (
                    p_bank_user_id, 
                    p_application_id, 
                    'offer_preparation_start', 
                    p_session_id
                )
                RETURNING log_id INTO v_log_id;
                
                RETURN v_log_id;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Created record_offer_preparation_start function');
        
        // Create a function to record offer preparation end
        await client.query(`
            CREATE OR REPLACE FUNCTION record_offer_preparation_end(
                p_bank_user_id INTEGER,
                p_application_id INTEGER,
                p_session_id VARCHAR(255) DEFAULT NULL
            ) RETURNS INTEGER AS $$
            DECLARE
                v_log_id INTEGER;
            BEGIN
                INSERT INTO bank_application_access_log (
                    bank_user_id, 
                    application_id, 
                    action_type, 
                    session_id
                ) VALUES (
                    p_bank_user_id, 
                    p_application_id, 
                    'offer_preparation_end', 
                    p_session_id
                )
                RETURNING log_id INTO v_log_id;
                
                RETURN v_log_id;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Created record_offer_preparation_end function');
        
        console.log('\n🎉 View tracking and access logging system created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating view tracking tables:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createViewTrackingTables();

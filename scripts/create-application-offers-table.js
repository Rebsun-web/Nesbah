const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createApplicationOffersTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating application_offers table...');
        
        await client.query('BEGIN');

        // Check if table already exists
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'application_offers'
            );
        `;
        
        const tableExists = await client.query(tableExistsQuery);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ application_offers table already exists');
            return;
        }

        // Create application_offers table with all fields from existing code
        await client.query(`
            CREATE TABLE application_offers (
                offer_id SERIAL PRIMARY KEY,
                submitted_application_id INTEGER NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
                bank_user_id INTEGER REFERENCES bank_users(user_id) ON DELETE CASCADE,
                submitted_by_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                
                -- Offer Details
                offer_device_setup_fee DECIMAL(10,2) DEFAULT 0,
                offer_transaction_fee_mada DECIMAL(5,2) DEFAULT 0,
                offer_transaction_fee_visa_mc DECIMAL(5,2) DEFAULT 0,
                offer_settlement_time_mada INTEGER DEFAULT 0,
                offer_settlement_time_visa_mc INTEGER DEFAULT 0,
                offer_comment TEXT,
                offer_terms TEXT,
                offer_validity_days INTEGER DEFAULT 30,
                
                -- Bank Information
                bank_name VARCHAR(255),
                bank_contact_person VARCHAR(255),
                bank_contact_email VARCHAR(255),
                bank_contact_phone VARCHAR(50),
                
                -- Offer Features
                includes_hardware BOOLEAN DEFAULT false,
                includes_software BOOLEAN DEFAULT false,
                includes_support BOOLEAN DEFAULT false,
                support_hours VARCHAR(100),
                warranty_months INTEGER DEFAULT 0,
                pricing_tier VARCHAR(100),
                volume_discount_threshold DECIMAL(10,2) DEFAULT 0,
                volume_discount_percentage DECIMAL(5,2) DEFAULT 0,
                
                -- Compliance and Regulatory
                compliance_certifications TEXT[] DEFAULT '{}',
                regulatory_approvals TEXT[] DEFAULT '{}',
                settlement_time VARCHAR(100),
                
                -- Financial Details
                deal_value DECIMAL(15,2) DEFAULT 0,
                commission_rate DECIMAL(5,2) DEFAULT 0,
                commission_amount DECIMAL(10,2) DEFAULT 0,
                bank_revenue DECIMAL(10,2) DEFAULT 0,
                
                -- Admin and Status
                admin_notes TEXT,
                is_featured BOOLEAN DEFAULT false,
                featured_reason TEXT,
                status VARCHAR(50) DEFAULT 'submitted',
                
                -- Timestamps
                submitted_at TIMESTAMP DEFAULT NOW(),
                accepted_at TIMESTAMP,
                expires_at TIMESTAMP,
                offer_selection_deadline TIMESTAMP,
                
                -- File Uploads
                uploaded_document BYTEA,
                uploaded_mimetype VARCHAR(100),
                uploaded_filename VARCHAR(255),
                
                -- Indexes for performance
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX idx_application_offers_submitted_application_id ON application_offers(submitted_application_id);
            CREATE INDEX idx_application_offers_bank_user_id ON application_offers(bank_user_id);
            CREATE INDEX idx_application_offers_submitted_by_user_id ON application_offers(submitted_by_user_id);
            CREATE INDEX idx_application_offers_status ON application_offers(status);
            CREATE INDEX idx_application_offers_submitted_at ON application_offers(submitted_at);
            CREATE INDEX idx_application_offers_expires_at ON application_offers(expires_at);
        `);

        await client.query('COMMIT');
        
        console.log('✅ application_offers table created successfully with all required fields and indexes!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating application_offers table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the table creation
if (require.main === module) {
    createApplicationOffersTable()
        .then(() => {
            console.log('\n✅ application_offers table creation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ application_offers table creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createApplicationOffersTable };

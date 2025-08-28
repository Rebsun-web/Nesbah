const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nesbah_dev',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupMockData() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Setting up mock data for revenue analytics...');
        
        // Create tables if they don't exist
        await createTables(client);
        
        // Populate with mock data
        await populateMockData(client);
        
        console.log('✅ Mock data setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up mock data:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function createTables(client) {
    console.log('📋 Creating tables...');
    
    // Create business_users table
    await client.query(`
        CREATE TABLE IF NOT EXISTS business_users (
            user_id SERIAL PRIMARY KEY,
            trade_name VARCHAR(255) NOT NULL,
            cr_number VARCHAR(50) UNIQUE NOT NULL,
            registration_status VARCHAR(20) DEFAULT 'active',
            city VARCHAR(100),
            cr_capital DECIMAL(15,2),
            contact_person VARCHAR(255),
            contact_person_number VARCHAR(20),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
    
    // Create bank_users table
    await client.query(`
        CREATE TABLE IF NOT EXISTS bank_users (
            user_id SERIAL PRIMARY KEY,
            entity_name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            contact_person_number VARCHAR(20),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
    
    // Create pos_application table
    await client.query(`
        CREATE TABLE IF NOT EXISTS pos_application (
            application_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES business_users(user_id),
            status VARCHAR(20) DEFAULT 'submitted',
            trade_name VARCHAR(255),
            cr_number VARCHAR(50),
            city VARCHAR(100),
            cr_capital DECIMAL(15,2),
            contact_person VARCHAR(255),
            contact_person_number VARCHAR(20),
            submitted_at TIMESTAMP DEFAULT NOW()
        )
    `);
    
                // Create submitted_applications table
            await client.query(`
                CREATE TABLE IF NOT EXISTS submitted_applications (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER REFERENCES pos_application(application_id),
                    application_type VARCHAR(20) DEFAULT 'pos',
                    business_user_id INTEGER REFERENCES business_users(user_id),
                    status VARCHAR(20) DEFAULT 'submitted',
                    revenue_collected DECIMAL(10,2) DEFAULT 0,
                    offers_count INTEGER DEFAULT 0,
                    purchased_by INTEGER[] DEFAULT '{}',
                    ignored_by INTEGER[] DEFAULT '{}',
                    opened_by INTEGER[] DEFAULT '{}',
                    auction_end_time TIMESTAMP,
                    offer_selection_end_time TIMESTAMP,
                    submitted_at TIMESTAMP DEFAULT NOW()
                )
            `);
    
    // Create application_revenue table
    await client.query(`
        CREATE TABLE IF NOT EXISTS application_revenue (
            id SERIAL PRIMARY KEY,
            application_id INTEGER REFERENCES submitted_applications(id),
            bank_user_id INTEGER REFERENCES bank_users(user_id),
            amount DECIMAL(10,2) NOT NULL,
            transaction_type VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
    
    console.log('✅ Tables created successfully');
}

async function populateMockData(client) {
    console.log('📊 Populating mock data...');
    
    // Clear existing data
    await client.query('DELETE FROM application_revenue');
    await client.query('DELETE FROM submitted_applications');
    await client.query('DELETE FROM pos_application');
    await client.query('DELETE FROM bank_users');
    await client.query('DELETE FROM business_users');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE business_users_user_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bank_users_user_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE pos_application_application_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE submitted_applications_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE application_revenue_id_seq RESTART WITH 1');
    
    // Create business users
    const businessUsers = await client.query(`
        INSERT INTO business_users (trade_name, cr_number, city, cr_capital, contact_person, contact_person_number)
        VALUES 
            ('Tech Solutions Ltd', 'CR001', 'Riyadh', 500000, 'Ahmed Al-Rashid', '+966501234567'),
            ('Digital Innovations', 'CR002', 'Jeddah', 750000, 'Sarah Al-Zahra', '+966507654321'),
            ('Smart Systems Co', 'CR003', 'Dammam', 300000, 'Mohammed Al-Sayed', '+966509876543'),
            ('Future Tech', 'CR004', 'Mecca', 400000, 'Fatima Al-Hassan', '+966501112223'),
            ('Innovation Hub', 'CR005', 'Medina', 600000, 'Omar Al-Khalil', '+966503334445'),
            ('Digital Dynamics', 'CR006', 'Riyadh', 450000, 'Layla Al-Mansour', '+966505556667'),
            ('Tech Pioneers', 'CR007', 'Jeddah', 800000, 'Khalid Al-Rashid', '+966507778889'),
            ('Smart Solutions', 'CR008', 'Dammam', 350000, 'Aisha Al-Zahra', '+966509990001'),
            ('Future Systems', 'CR009', 'Mecca', 550000, 'Yusuf Al-Hassan', '+966501112223'),
            ('Innovation Labs', 'CR010', 'Medina', 700000, 'Noor Al-Khalil', '+966503334445')
        RETURNING user_id, trade_name
    `);
    
    // Create bank users
    const bankUsers = await client.query(`
        INSERT INTO bank_users (entity_name, contact_person, contact_person_number)
        VALUES 
            ('Saudi National Bank', 'Abdullah Al-Rashid', '+966501111111'),
            ('Riyad Bank', 'Fatima Al-Zahra', '+966502222222'),
            ('Arab National Bank', 'Mohammed Al-Sayed', '+966503333333'),
            ('Bank Aljazira', 'Aisha Al-Hassan', '+966504444444'),
            ('Al Rajhi Bank', 'Omar Al-Khalil', '+966505555555')
        RETURNING user_id, entity_name
    `);
    
    // Create POS applications
    const posApplications = await client.query(`
        INSERT INTO pos_application (user_id, trade_name, cr_number, city, cr_capital, contact_person, contact_person_number)
        VALUES 
            (1, 'Tech Solutions Ltd', 'CR001', 'Riyadh', 500000, 'Ahmed Al-Rashid', '+966501234567'),
            (2, 'Digital Innovations', 'CR002', 'Jeddah', 750000, 'Sarah Al-Zahra', '+966507654321'),
            (3, 'Smart Systems Co', 'CR003', 'Dammam', 300000, 'Mohammed Al-Sayed', '+966509876543'),
            (4, 'Future Tech', 'CR004', 'Mecca', 400000, 'Fatima Al-Hassan', '+966501112223'),
            (5, 'Innovation Hub', 'CR005', 'Medina', 600000, 'Omar Al-Khalil', '+966503334445'),
            (6, 'Digital Dynamics', 'CR006', 'Riyadh', 450000, 'Layla Al-Mansour', '+966505556667'),
            (7, 'Tech Pioneers', 'CR007', 'Jeddah', 800000, 'Khalid Al-Rashid', '+966507778889'),
            (8, 'Smart Solutions', 'CR008', 'Dammam', 350000, 'Aisha Al-Zahra', '+966509990001'),
            (9, 'Future Systems', 'CR009', 'Mecca', 550000, 'Yusuf Al-Hassan', '+966501112223'),
            (10, 'Innovation Labs', 'CR010', 'Medina', 700000, 'Noor Al-Khalil', '+966503334445')
        RETURNING application_id
    `);
    
    // Create submitted applications with realistic data spread over the last 7 days
    const now = new Date();
    const applications = [];
    
    // Generate applications for the last 7 days with varying revenue and statuses
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const appId = (i % 10) + 1;
        const status = getRandomStatus();
        const revenue = status === 'completed' ? 25.00 : 0.00;
        const offersCount = Math.floor(Math.random() * 5) + 1;
        
        applications.push({
            application_id: appId,
            business_user_id: appId,
            status,
            revenue_collected: revenue,
            offers_count: offersCount,
            submitted_at: date
        });
    }
    
    // Insert applications
    for (const app of applications) {
        await client.query(`
            INSERT INTO submitted_applications (
                application_id, business_user_id, status, revenue_collected, 
                offers_count, submitted_at, auction_end_time, offer_selection_end_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $6 + INTERVAL '48 hours', $6 + INTERVAL '72 hours')
        `, [app.application_id, app.business_user_id, app.status, app.revenue_collected, 
            app.offers_count, app.submitted_at]);
    }
    
    // Create revenue records for completed applications
    const completedApps = await client.query(`
        SELECT id, application_id FROM submitted_applications 
        WHERE status = 'completed' AND revenue_collected > 0
    `);
    
    for (const app of completedApps.rows) {
        const bankUserId = Math.floor(Math.random() * 5) + 1;
        await client.query(`
            INSERT INTO application_revenue (application_id, bank_user_id, amount, transaction_type)
            VALUES ($1, $2, $3, 'lead_purchase')
        `, [app.id, bankUserId, 25.00]);
        
        // Update purchased_by array
        await client.query(`
            UPDATE submitted_applications 
            SET purchased_by = ARRAY[$1] 
            WHERE id = $2
        `, [bankUserId, app.id]);
    }
    
    console.log('✅ Mock data populated successfully');
    
    // Show summary
    const summary = await client.query(`
        SELECT 
            COUNT(*) as total_applications,
            SUM(revenue_collected) as total_revenue,
            COUNT(CASE WHEN revenue_collected > 0 THEN 1 END) as revenue_generating_apps,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_apps,
            COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_apps,
            COUNT(CASE WHEN status = 'deal_expired' THEN 1 END) as expired_apps,
            COUNT(CASE WHEN status = 'pending_offers' THEN 1 END) as pending_apps
        FROM submitted_applications
    `);
    
    const data = summary.rows[0];
    console.log('\n📊 Mock Data Summary:');
    console.log(`Total Applications: ${data.total_applications}`);
    console.log(`Total Revenue: SAR ${data.total_revenue}`);
    console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
    console.log(`Completed Applications: ${data.completed_apps}`);
    console.log(`Abandoned Applications: ${data.abandoned_apps}`);
    console.log(`Expired Applications: ${data.expired_apps}`);
    console.log(`Pending Applications: ${data.pending_apps}`);
}

function getRandomStatus() {
    const statuses = ['completed', 'completed', 'completed', 'abandoned', 'deal_expired', 'pending_offers'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Run the script
if (require.main === module) {
    setupMockData()
        .then(() => {
            console.log('🎉 Mock data setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupMockData };

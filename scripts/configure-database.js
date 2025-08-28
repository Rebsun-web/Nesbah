const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function configureDatabase() {
    console.log('🔧 Database Configuration for Revenue Analytics Testing\n');
    
    console.log('Please provide your database connection details:');
    console.log('(You can use a remote database or local PostgreSQL)\n');
    
    const host = await question('Database host (default: localhost): ') || 'localhost';
    const port = await question('Database port (default: 5432): ') || '5432';
    const database = await question('Database name (default: nesbah_dev): ') || 'nesbah_dev';
    const username = await question('Database username (default: postgres): ') || 'postgres';
    const password = await question('Database password: ');
    
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
    
    console.log('\n🔗 Testing database connection...');
    
    const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        // Test if tables exist
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('business_users', 'bank_users', 'pos_application', 'submitted_applications', 'application_revenue')
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('📋 No existing tables found. Would you like to create them?');
            const createTables = await question('Create tables? (y/n): ');
            
            if (createTables.toLowerCase() === 'y') {
                console.log('🔄 Creating tables...');
                await createTables(client);
                console.log('✅ Tables created successfully!');
            }
        } else {
            console.log(`📋 Found ${tableCheck.rows.length} existing tables`);
        }
        
        // Check if data exists
        const dataCheck = await client.query('SELECT COUNT(*) as count FROM submitted_applications');
        const appCount = parseInt(dataCheck.rows[0].count);
        
        if (appCount === 0) {
            console.log('📊 No applications found. Would you like to populate with mock data?');
            const populateData = await question('Populate mock data? (y/n): ');
            
            if (populateData.toLowerCase() === 'y') {
                console.log('🔄 Populating mock data...');
                await populateMockData(client);
                console.log('✅ Mock data populated successfully!');
            }
        } else {
            console.log(`📊 Found ${appCount} existing applications`);
            
            const revenueCheck = await client.query('SELECT SUM(revenue_collected) as total FROM submitted_applications');
            const totalRevenue = revenueCheck.rows[0].total || 0;
            console.log(`💰 Total revenue: SAR ${totalRevenue}`);
        }
        
        client.release();
        
        // Save configuration
        console.log('\n💾 Saving database configuration...');
        const config = {
            DATABASE_URL: connectionString,
            NODE_ENV: 'development'
        };
        
        console.log('\n📝 Add this to your environment variables:');
        console.log(`DATABASE_URL=${connectionString}`);
        console.log('NODE_ENV=development');
        
        console.log('\n🎉 Database configuration completed!');
        console.log('You can now run the revenue analytics locally.');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\nPlease check your database credentials and try again.');
    } finally {
        rl.close();
    }
}

async function createTables(client) {
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
            created_at TIMESTAMP DEFAULT NOW(),
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
}

async function populateMockData(client) {
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
    await client.query(`
        INSERT INTO business_users (trade_name, cr_number, city, cr_capital, contact_person, contact_person_number)
        VALUES 
            ('Tech Solutions Ltd', 'CR001', 'Riyadh', 500000, 'Ahmed Al-Rashid', '+966501234567'),
            ('Digital Innovations', 'CR002', 'Jeddah', 750000, 'Sarah Al-Zahra', '+966507654321'),
            ('Smart Systems Co', 'CR003', 'Dammam', 300000, 'Mohammed Al-Sayed', '+966509876543'),
            ('Future Tech', 'CR004', 'Mecca', 400000, 'Fatima Al-Hassan', '+966501112223'),
            ('Innovation Hub', 'CR005', 'Medina', 600000, 'Omar Al-Khalil', '+966503334445')
    `);
    
    // Create bank users
    await client.query(`
        INSERT INTO bank_users (entity_name, contact_person, contact_person_number)
        VALUES 
            ('Saudi National Bank', 'Abdullah Al-Rashid', '+966501111111'),
            ('Riyad Bank', 'Fatima Al-Zahra', '+966502222222'),
            ('Arab National Bank', 'Mohammed Al-Sayed', '+966503333333'),
            ('Bank Aljazira', 'Aisha Al-Hassan', '+966504444444'),
            ('Al Rajhi Bank', 'Omar Al-Khalil', '+966505555555')
    `);
    
    // Create POS applications
    await client.query(`
        INSERT INTO pos_application (user_id, trade_name, cr_number, city, cr_capital, contact_person, contact_person_number)
        VALUES 
            (1, 'Tech Solutions Ltd', 'CR001', 'Riyadh', 500000, 'Ahmed Al-Rashid', '+966501234567'),
            (2, 'Digital Innovations', 'CR002', 'Jeddah', 750000, 'Sarah Al-Zahra', '+966507654321'),
            (3, 'Smart Systems Co', 'CR003', 'Dammam', 300000, 'Mohammed Al-Sayed', '+966509876543'),
            (4, 'Future Tech', 'CR004', 'Mecca', 400000, 'Fatima Al-Hassan', '+966501112223'),
            (5, 'Innovation Hub', 'CR005', 'Medina', 600000, 'Omar Al-Khalil', '+966503334445')
    `);
    
    // Create submitted applications with realistic data
    const now = new Date();
    const applications = [];
    
    // Generate applications for the last 7 days
    for (let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const appId = (i % 5) + 1;
        const status = getRandomStatus();
        const revenue = status === 'completed' ? 25.00 : 0.00;
        const offersCount = Math.floor(Math.random() * 5) + 1;
        
        applications.push({
            application_id: appId,
            business_user_id: appId,
            status,
            revenue_collected: revenue,
            offers_count: offersCount,
            created_at: date,
            submitted_at: date
        });
    }
    
    // Insert applications
    for (const app of applications) {
        await client.query(`
            INSERT INTO submitted_applications (
                application_id, business_user_id, status, revenue_collected, 
                offers_count, created_at, submitted_at, auction_end_time, offer_selection_end_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $6 + INTERVAL '48 hours', $6 + INTERVAL '72 hours')
        `, [app.application_id, app.business_user_id, app.status, app.revenue_collected, 
            app.offers_count, app.created_at, app.submitted_at]);
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
}

function getRandomStatus() {
    const statuses = ['completed', 'completed', 'completed', 'abandoned', 'deal_expired', 'pending_offers'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Run the script
if (require.main === module) {
    configureDatabase()
        .then(() => {
            console.log('\n🎉 Configuration completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Configuration failed:', error);
            process.exit(1);
        });
}

module.exports = { configureDatabase };

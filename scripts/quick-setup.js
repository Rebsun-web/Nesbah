const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function quickSetup() {
    console.log('🔗 Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const client = await pool.connect();
    
    try {
        console.log('🚀 Quick setup for revenue analytics...');
        
        // Create tables if they don't exist
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
        
        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await client.query('DELETE FROM application_revenue');
        await client.query('DELETE FROM submitted_applications');
        await client.query('DELETE FROM pos_application');
        await client.query('DELETE FROM bank_users');
        await client.query('DELETE FROM business_users');
        
        // Reset sequences (only if they exist)
        try {
            await client.query('ALTER SEQUENCE business_users_user_id_seq RESTART WITH 1');
            await client.query('ALTER SEQUENCE bank_users_user_id_seq RESTART WITH 1');
            await client.query('ALTER SEQUENCE pos_application_application_id_seq RESTART WITH 1');
            await client.query('ALTER SEQUENCE submitted_applications_id_seq RESTART WITH 1');
            await client.query('ALTER SEQUENCE application_revenue_id_seq RESTART WITH 1');
        } catch (error) {
            console.log('⚠️ Some sequences may not exist yet, continuing...');
        }
        
        // Create sample data
        console.log('📊 Creating sample data...');
        
        // First create users in the users table and get their IDs
        const userEmails = [
            'tech@business.com',
            'digital@business.com', 
            'smart@business.com',
            'future@business.com',
            'innovation@business.com'
        ];
        
        const userIds = [];
        for (const email of userEmails) {
            try {
                const userResult = await client.query(`
                    INSERT INTO users (email, password, user_type)
                    VALUES ($1, 'password123', 'business_user')
                    RETURNING user_id
                `, [email]);
                userIds.push(userResult.rows[0].user_id);
            } catch (error) {
                // If user already exists, get their ID
                if (error.code === '23505') { // unique_violation
                    const existingUser = await client.query(`
                        SELECT user_id FROM users WHERE email = $1
                    `, [email]);
                    userIds.push(existingUser.rows[0].user_id);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Created users with IDs:', userIds);
        
        // Create business users with all required fields
        const businessData = [
            { cr_national: 'CR001', trade_name: 'Tech Solutions Ltd', address: 'Riyadh Business District, Riyadh', sector: 'Technology', capital: 500000, cr_number: 'CR001', city: 'Riyadh' },
            { cr_national: 'CR002', trade_name: 'Digital Innovations', address: 'Jeddah Corniche, Jeddah', sector: 'Technology', capital: 750000, cr_number: 'CR002', city: 'Jeddah' },
            { cr_national: 'CR003', trade_name: 'Smart Systems Co', address: 'Dammam Industrial Area, Dammam', sector: 'Technology', capital: 300000, cr_number: 'CR003', city: 'Dammam' },
            { cr_national: 'CR004', trade_name: 'Future Tech', address: 'Mecca Business Center, Mecca', sector: 'Technology', capital: 400000, cr_number: 'CR004', city: 'Mecca' },
            { cr_national: 'CR005', trade_name: 'Innovation Hub', address: 'Medina Technology Park, Medina', sector: 'Technology', capital: 600000, cr_number: 'CR005', city: 'Medina' }
        ];
        
        for (let i = 0; i < businessData.length; i++) {
            const data = businessData[i];
            try {
                await client.query(`
                    INSERT INTO business_users (
                        cr_national_number, trade_name, address, sector, cr_capital, 
                        user_id, registration_status, cr_number, city
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
                `, [data.cr_national, data.trade_name, data.address, data.sector, data.capital, userIds[i], data.cr_number, data.city]);
            } catch (error) {
                // If business user already exists, skip
                if (error.code === '23505') { // unique_violation
                    console.log(`Business user ${data.cr_national} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Created business users');
        
        // Create bank users with correct columns
        const bankEmails = [
            'sbn@bank.com',
            'riyad@bank.com',
            'anb@bank.com',
            'aljazira@bank.com',
            'alrajhi@bank.com'
        ];
        
        const bankUserIds = [];
        for (const email of bankEmails) {
            try {
                const bankResult = await client.query(`
                    INSERT INTO bank_users (email, credit_limit)
                    VALUES ($1, $2)
                    RETURNING user_id
                `, [email, 10000.00]);
                bankUserIds.push(bankResult.rows[0].user_id);
            } catch (error) {
                // If bank user already exists, get their ID
                if (error.code === '23505') { // unique_violation
                    const existingBank = await client.query(`
                        SELECT user_id FROM bank_users WHERE email = $1
                    `, [email]);
                    bankUserIds.push(existingBank.rows[0].user_id);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Created bank users with IDs:', bankUserIds);
        
        // Create POS applications (simplified columns)
        await client.query(`
            INSERT INTO pos_application (user_id, trade_name, cr_number, city, cr_capital)
            VALUES 
                (1, 'Tech Solutions Ltd', 'CR001', 'Riyadh', 500000),
                (2, 'Digital Innovations', 'CR002', 'Jeddah', 750000),
                (3, 'Smart Systems Co', 'CR003', 'Dammam', 300000),
                (4, 'Future Tech', 'CR004', 'Mecca', 400000),
                (5, 'Innovation Hub', 'CR005', 'Medina', 600000)
        `);
        
        // Create submitted applications with realistic data over the last 7 days
        const now = new Date();
        const applications = [];
        
        // Generate applications for the last 7 days
        for (let i = 0; i < 35; i++) {
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
        
        console.log('✅ Sample data created successfully');
        
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
        console.log('\n📊 Data Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${data.total_revenue}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Abandoned Applications: ${data.abandoned_apps}`);
        console.log(`Expired Applications: ${data.expired_apps}`);
        console.log(`Pending Applications: ${data.pending_apps}`);
        
        console.log('\n🎉 Setup completed! You can now test the revenue analytics.');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

function getRandomStatus() {
    const statuses = ['completed', 'completed', 'completed', 'abandoned', 'deal_expired', 'pending_offers'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Run the script
if (require.main === module) {
    quickSetup()
        .then(() => {
            console.log('🎉 Quick setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Quick setup failed:', error);
            process.exit(1);
        });
}

module.exports = { quickSetup };

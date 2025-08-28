const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function simpleSetup() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Simple setup for revenue analytics...');
        console.log('🔗 Connected to database successfully');
        
        // Check what tables exist
        console.log('📋 Checking existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'business_users', 'bank_users', 'pos_application', 'submitted_applications', 'application_revenue')
            ORDER BY table_name
        `);
        
        console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
        
        // Check business_users structure
        const businessUsersColumns = await client.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'business_users' 
            ORDER BY ordinal_position
        `);
        
        console.log('business_users columns:', businessUsersColumns.rows.map(r => `${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
        
        // Check if we have any existing data
        const existingData = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM business_users) as business_users_count,
                (SELECT COUNT(*) FROM bank_users) as bank_users_count,
                (SELECT COUNT(*) FROM submitted_applications) as applications_count,
                (SELECT COUNT(*) FROM application_revenue) as revenue_count
        `);
        
        const counts = existingData.rows[0];
        console.log('\n📊 Existing data counts:');
        console.log(`Users: ${counts.users_count}`);
        console.log(`Business users: ${counts.business_users_count}`);
        console.log(`Bank users: ${counts.bank_users_count}`);
        console.log(`Applications: ${counts.applications_count}`);
        console.log(`Revenue records: ${counts.revenue_count}`);
        
        // If we have data, just show summary
        if (counts.applications_count > 0) {
            console.log('\n✅ Database already has data!');
            
            // Show revenue summary
            const revenueSummary = await client.query(`
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
            
            const data = revenueSummary.rows[0];
            console.log('\n📊 Revenue Summary:');
            console.log(`Total Applications: ${data.total_applications}`);
            console.log(`Total Revenue: SAR ${data.total_revenue || 0}`);
            console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
            console.log(`Completed Applications: ${data.completed_apps}`);
            console.log(`Abandoned Applications: ${data.abandoned_apps}`);
            console.log(`Expired Applications: ${data.expired_apps}`);
            console.log(`Pending Applications: ${data.pending_apps}`);
            
            console.log('\n🎉 You can now test the revenue analytics!');
            return;
        }
        
        // If no data, create minimal test data
        console.log('\n📊 Creating minimal test data...');
        
        // First create a user in the users table
        const userResult = await client.query(`
            INSERT INTO users (email, password, user_type)
            VALUES ($1, $2, $3)
            RETURNING user_id
        `, ['test2@business.com', 'password123', 'business_user']);
        
        const userId = userResult.rows[0].user_id;
        console.log('✅ Created user with ID:', userId);
        
        // Create a simple business user (using required columns, excluding user_id)
        const requiredColumns = businessUsersColumns.rows
            .filter(col => col.is_nullable === 'NO' && col.column_name !== 'user_id')
            .map(col => col.column_name)
            .slice(0, 5); // Take first 5 required columns
        
        console.log('Using required columns:', requiredColumns);
        
        // Create minimal business user with unique CR number
        const businessUserQuery = `
            INSERT INTO business_users (user_id, ${requiredColumns.join(', ')})
            VALUES ($1, ${requiredColumns.map((_, i) => `$${i + 2}`).join(', ')})
            RETURNING user_id
        `;
        
        const timestamp = Date.now();
        const businessUserValues = [
            userId, // user_id
            `CR${timestamp}`, // cr_national_number (unique timestamp-based)
            'Test Business 2', // trade_name
            'Riyadh Address', // address
            'Technology', // sector
            'active' // registration_status
        ];
        
        const businessUserResult = await client.query(businessUserQuery, businessUserValues);
        const businessUserId = businessUserResult.rows[0].user_id;
        console.log('✅ Created business user with ID:', businessUserId);
        
        // Create a simple bank user with correct columns
        const bankUserResult = await client.query(`
            INSERT INTO bank_users (email, credit_limit)
            VALUES ($1, $2)
            RETURNING user_id
        `, ['test@bank.com', 5000.00]);
        console.log('✅ Created bank user with ID:', bankUserResult.rows[0].user_id);
        
        // Create a simple POS application
        await client.query(`
            INSERT INTO pos_application (user_id, trade_name, cr_number)
            VALUES ($1, 'Test Business', 'CR001')
        `, [businessUserId]);
        console.log('✅ Created POS application');
        
        // Create some test applications with revenue
        const now = new Date();
        for (let i = 0; i < 10; i++) {
            const daysAgo = Math.floor(Math.random() * 7);
            const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            const status = Math.random() > 0.5 ? 'completed' : 'abandoned';
            const revenue = status === 'completed' ? 25.00 : 0.00;
            
            await client.query(`
                INSERT INTO submitted_applications (
                    application_id, business_user_id, status, revenue_collected, 
                    submitted_at, auction_end_time, offer_selection_end_time
                ) VALUES (1, $1, $2, $3, $4, $4 + INTERVAL '48 hours', $4 + INTERVAL '72 hours')
            `, [businessUserId, status, revenue, date]);
        }
        console.log('✅ Created 10 test applications');
        
        // Create revenue records for completed applications
        const completedApps = await client.query(`
            SELECT id FROM submitted_applications 
            WHERE status = 'completed' AND revenue_collected > 0
        `);
        
        for (const app of completedApps.rows) {
            await client.query(`
                INSERT INTO application_revenue (application_id, bank_user_id, amount, transaction_type)
                VALUES ($1, 1, $2, 'lead_purchase')
            `, [app.id, 25.00]);
        }
        console.log('✅ Created revenue records');
        
        // Show final summary
        const finalSummary = await client.query(`
            SELECT 
                COUNT(*) as total_applications,
                SUM(revenue_collected) as total_revenue,
                COUNT(CASE WHEN revenue_collected > 0 THEN 1 END) as revenue_generating_apps,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_apps
            FROM submitted_applications
        `);
        
        const data = finalSummary.rows[0];
        console.log('\n📊 Final Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${data.total_revenue || 0}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        
        console.log('\n🎉 Setup completed! You can now test the revenue analytics.');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    simpleSetup()
        .then(() => {
            console.log('\n🎉 Simple setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Simple setup failed:', error);
            process.exit(1);
        });
}

module.exports = { simpleSetup };

const pool = require('../src/lib/db.cjs');

async function populateRevenueData() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting revenue data population...');
        
        // Clear existing data to start fresh
        await client.query('DELETE FROM application_revenue');
        await client.query('DELETE FROM submitted_applications');
        await client.query('DELETE FROM pos_application');
        await client.query('DELETE FROM business_users WHERE user_id >= 1001 AND user_id <= 1010');
        await client.query('DELETE FROM bank_users WHERE user_id >= 2001 AND user_id <= 2010');
        
        console.log('🧹 Cleared existing test data');
        
        // Create sample business users
        const businessUsers = await client.query(`
            INSERT INTO business_users (user_id, cr_national_number, trade_name, cr_number, registration_status, city, cr_capital)
            VALUES 
                (1001, '4030000001', 'Al-Riyadh Trading Co.', 'CR001', 'active', 'Riyadh', 100000),
                (1002, '4030000002', 'Jeddah Electronics Ltd.', 'CR002', 'active', 'Jeddah', 150000),
                (1003, '4030000003', 'Dammam Retail Solutions', 'CR003', 'active', 'Dammam', 200000),
                (1004, '4030000004', 'Mecca Hospitality Group', 'CR004', 'active', 'Mecca', 120000),
                (1005, '4030000005', 'Medina Trading Partners', 'CR005', 'active', 'Medina', 180000),
                (1006, '4030000006', 'Abha Business Center', 'CR006', 'active', 'Abha', 90000),
                (1007, '4030000007', 'Tabuk Commercial Co.', 'CR007', 'active', 'Tabuk', 110000),
                (1008, '4030000008', 'Najran Retail Group', 'CR008', 'active', 'Najran', 85000),
                (1009, '4030000009', 'Jizan Trading House', 'CR009', 'active', 'Jizan', 95000),
                (1010, '4030000010', 'Hail Business Solutions', 'CR010', 'active', 'Hail', 130000)
            RETURNING user_id
        `);
        
        // Create sample bank users
        const bankUsers = await client.query(`
            INSERT INTO bank_users (user_id, entity_name, contact_person, contact_person_number)
            VALUES 
                (2001, 'Saudi National Bank', 'Ahmed Al-Rashid', '+966501234567'),
                (2002, 'Riyad Bank', 'Fatima Al-Zahra', '+966507654321'),
                (2003, 'Arab National Bank', 'Omar Al-Mansouri', '+966509876543'),
                (2004, 'Bank Aljazira', 'Layla Al-Qahtani', '+966501112223'),
                (2005, 'Saudi Investment Bank', 'Khalid Al-Sabah', '+966502223334'),
                (2006, 'Bank Albilad', 'Noor Al-Rashid', '+966503334445'),
                (2007, 'Al Rajhi Bank', 'Yusuf Al-Mahmoud', '+966504445556'),
                (2008, 'Saudi British Bank', 'Aisha Al-Farsi', '+966505556667'),
                (2009, 'Bank Alinma', 'Hassan Al-Qahtani', '+966506667778'),
                (2010, 'Saudi French Bank', 'Mariam Al-Sabah', '+966507778889')
            RETURNING user_id
        `);
        
        console.log('✅ Created business and bank users');
        
        // Create sample POS applications
        const posApplications = await client.query(`
            INSERT INTO pos_application (user_id, status, trade_name, cr_number, city, cr_capital, contact_person, contact_person_number)
            VALUES 
                (1001, 'submitted', 'Al-Riyadh Trading Co.', 'CR001', 'Riyadh', 100000, 'Mohammed Al-Rashid', '+966501111111'),
                (1002, 'submitted', 'Jeddah Electronics Ltd.', 'CR002', 'Jeddah', 150000, 'Ahmed Al-Zahra', '+966502222222'),
                (1003, 'submitted', 'Dammam Retail Solutions', 'CR003', 'Dammam', 200000, 'Omar Al-Mansouri', '+966503333333'),
                (1004, 'submitted', 'Mecca Hospitality Group', 'CR004', 'Mecca', 120000, 'Fatima Al-Qahtani', '+966504444444'),
                (1005, 'submitted', 'Medina Trading Partners', 'CR005', 'Medina', 180000, 'Khalid Al-Sabah', '+966505555555'),
                (1006, 'submitted', 'Abha Business Center', 'CR006', 'Abha', 90000, 'Noor Al-Rashid', '+966506666666'),
                (1007, 'submitted', 'Tabuk Commercial Co.', 'CR007', 'Tabuk', 110000, 'Yusuf Al-Mahmoud', '+966507777777'),
                (1008, 'submitted', 'Najran Retail Group', 'CR008', 'Najran', 85000, 'Aisha Al-Farsi', '+966508888888'),
                (1009, 'submitted', 'Jizan Trading House', 'CR009', 'Jizan', 95000, 'Hassan Al-Qahtani', '+966509999999'),
                (1010, 'submitted', 'Hail Business Solutions', 'CR010', 'Hail', 130000, 'Mariam Al-Sabah', '+966500000000')
            RETURNING application_id
        `);
        
        console.log('✅ Created POS applications');
        
        // Create submitted applications with realistic revenue data over the last 30 days
        const now = new Date();
        const applications = [];
        
        // Generate applications for the last 30 days with realistic patterns
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const businessUserId = 1001 + (i % 10);
            const applicationId = i + 1;
            
            // Create 2-4 applications per day with different statuses
            const appsPerDay = 2 + (i % 3); // 2-4 apps per day
            
            for (let j = 0; j < appsPerDay; j++) {
                const appId = applicationId * 10 + j;
                const status = getRandomStatus();
                const revenue = status === 'completed' ? 25.00 : 0.00;
                const offersCount = status === 'completed' ? (1 + Math.floor(Math.random() * 4)) : 0;
                
                applications.push({
                    application_id: appId,
                    business_user_id: businessUserId,
                    status: status,
                    revenue_collected: revenue,
                    offers_count: offersCount,
                    created_at: date,
                    submitted_at: date
                });
            }
        }
        
        // Insert applications in batches
        for (const app of applications) {
            await client.query(`
                INSERT INTO submitted_applications (
                    application_id, application_type, business_user_id, status, 
                    revenue_collected, offers_count, created_at, submitted_at,
                    auction_end_time, offer_selection_end_time
                ) VALUES ($1, 'pos', $2, $3, $4, $5, $6, $7, $6 + INTERVAL '48 hours', $6 + INTERVAL '72 hours')
            `, [app.application_id, app.business_user_id, app.status, app.revenue_collected, 
                app.offers_count, app.created_at, app.submitted_at]);
        }
        
        console.log(`✅ Created ${applications.length} submitted applications`);
        
        // Create application_revenue records for completed applications
        const completedApps = await client.query(`
            SELECT id, application_id FROM submitted_applications 
            WHERE status = 'completed' AND revenue_collected > 0
        `);
        
        console.log(`💰 Creating revenue records for ${completedApps.rows.length} completed applications...`);
        
        for (const app of completedApps.rows) {
            const bankUserId = 2001 + Math.floor(Math.random() * 10);
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
        
        console.log('✅ Revenue data population completed!');
        
        // Show comprehensive summary
        const summary = await client.query(`
            SELECT 
                COUNT(*) as total_applications,
                SUM(revenue_collected) as total_revenue,
                COUNT(CASE WHEN revenue_collected > 0 THEN 1 END) as revenue_generating_apps,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_apps,
                COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_apps,
                COUNT(CASE WHEN status = 'deal_expired' THEN 1 END) as expired_apps,
                COUNT(CASE WHEN status = 'pending_offers' THEN 1 END) as pending_apps,
                COUNT(CASE WHEN status = 'offer_received' THEN 1 END) as offer_received_apps,
                AVG(CASE WHEN revenue_collected > 0 THEN revenue_collected END) as avg_revenue_per_app
            FROM submitted_applications
        `);
        
        const data = summary.rows[0];
        console.log('\n📊 Revenue Data Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${parseFloat(data.total_revenue || 0).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Abandoned Applications: ${data.abandoned_apps}`);
        console.log(`Expired Applications: ${data.expired_apps}`);
        console.log(`Pending Offers: ${data.pending_apps}`);
        console.log(`Offer Received: ${data.offer_received_apps}`);
        console.log(`Average Revenue per App: SAR ${parseFloat(data.avg_revenue_per_app || 0).toFixed(2)}`);
        
        // Show daily trend for last 7 days
        const dailyTrend = await client.query(`
            SELECT 
                DATE(submitted_at) as date,
                COUNT(*) as applications,
                SUM(revenue_collected) as revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM submitted_applications 
            WHERE submitted_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(submitted_at)
            ORDER BY date DESC
        `);
        
        console.log('\n📈 Last 7 Days Daily Trend:');
        dailyTrend.rows.forEach(row => {
            console.log(`${row.date}: ${row.applications} apps, SAR ${parseFloat(row.revenue || 0).toFixed(2)} revenue, ${row.completed} completed`);
        });
        
    } catch (error) {
        console.error('❌ Error populating revenue data:', error);
        throw error;
    } finally {
        client.release();
    }
}

function getRandomStatus() {
    const statuses = [
        'completed', 'completed', 'completed', 'completed', 'completed', // 50% completed
        'abandoned', 'abandoned', // 20% abandoned
        'deal_expired', 'deal_expired', // 20% expired
        'pending_offers', // 5% pending
        'offer_received' // 5% offer received
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Run the script
if (require.main === module) {
    populateRevenueData()
        .then(() => {
            console.log('🎉 Revenue data population script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { populateRevenueData };

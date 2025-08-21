const pool = require('../src/lib/db.cjs');

async function createSimpleRevenueTest() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Creating simple revenue test data...');
        
        // Clear existing test data first
        console.log('🧹 Clearing existing test data...');
        await client.query('DELETE FROM application_revenue WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM submitted_applications WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM pos_application WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM business_users WHERE user_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM bank_users WHERE user_id IN (2001, 2002, 2003)');
        await client.query('DELETE FROM users WHERE user_id IN (1001, 1002, 1003, 2001, 2002, 2003)');
        console.log('✅ Cleared existing test data');
        
        // Create users first to satisfy foreign key constraints
        console.log('👥 Creating users...');
        for (let i = 1; i <= 3; i++) {
            const userId = 1000 + i;
            const email = `business${i}@test.com`;
            await client.query(`
                INSERT INTO users (user_id, email, password, user_type, entity_name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [userId, email, 'hashedpassword123', 'business_user', `Business ${i}`]);
        }
        
        for (let i = 1; i <= 3; i++) {
            const userId = 2000 + i;
            const email = `bank${i}@test.com`;
            await client.query(`
                INSERT INTO users (user_id, email, password, user_type, entity_name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [userId, email, 'hashedpassword456', 'bank_user', `Bank ${i}`]);
        }
        console.log('✅ Created users');
        
        // Create business users (simplified structure)
        console.log('👥 Creating business users...');
        const businessUsers = [
            {
                user_id: 1001,
                cr_national_number: '4030000101',
                trade_name: 'Al-Riyadh Trading Co.',
                cr_number: 'CR001-2020',
                registration_status: 'active',
                sector: 'Retail & Trading',
                city: 'Riyadh',
                cr_capital: 600000,
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567',
                address: 'King Fahd Road, Riyadh'
            },
            {
                user_id: 1002,
                cr_national_number: '4030000102',
                trade_name: 'Jeddah Electronics Ltd.',
                cr_number: 'CR002-2019',
                registration_status: 'active',
                sector: 'Electronics & Technology',
                city: 'Jeddah',
                cr_capital: 900000,
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321',
                address: 'Tahlia Street, Jeddah'
            },
            {
                user_id: 1003,
                cr_national_number: '4030000103',
                trade_name: 'Dammam Retail Solutions',
                cr_number: 'CR003-2021',
                registration_status: 'active',
                sector: 'Retail & Services',
                city: 'Dammam',
                cr_capital: 480000,
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543',
                address: 'King Khalid Street, Dammam'
            }
        ];
        
        // Create business users
        for (const user of businessUsers) {
            await client.query(`
                INSERT INTO business_users (
                    user_id, cr_national_number, trade_name, cr_number, registration_status,
                    sector, city, cr_capital, contact_person, contact_person_number, address
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                user.user_id, user.cr_national_number, user.trade_name, user.cr_number, user.registration_status,
                user.sector, user.city, user.cr_capital, user.contact_person, user.contact_person_number, user.address
            ]);
        }
        
        console.log(`✅ Created ${businessUsers.length} business users`);
        
        // Create bank users
        console.log('🏦 Creating bank users...');
        const bankUsers = [
            {
                user_id: 2001,
                entity_name: 'Saudi National Bank',
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567'
            },
            {
                user_id: 2002,
                entity_name: 'Riyad Bank',
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321'
            },
            {
                user_id: 2003,
                entity_name: 'Arab National Bank',
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543'
            }
        ];
        
        // Create bank users
        for (const user of bankUsers) {
            await client.query(`
                INSERT INTO bank_users (user_id, entity_name, contact_person, contact_person_number)
                VALUES ($1, $2, $3, $4)
            `, [user.user_id, user.entity_name, user.contact_person, user.contact_person_number]);
        }
        
        console.log(`✅ Created ${bankUsers.length} bank users`);
        
        // Create POS applications (one per business user)
        console.log('📱 Creating POS applications...');
        const now = new Date();
        
        for (let i = 0; i < businessUsers.length; i++) {
            const user = businessUsers[i];
            const applicationId = 1001 + i;
            const submittedAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
            
            await client.query(`
                INSERT INTO pos_application (
                    application_id, user_id, status, trade_name, cr_number,
                    city, cr_capital, contact_person, contact_person_number, submitted_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                applicationId, user.user_id, 'submitted', user.trade_name, user.cr_number,
                user.city, user.cr_capital, user.contact_person, user.contact_person_number, submittedAt
            ]);
        }
        
        console.log(`✅ Created ${businessUsers.length} POS applications`);
        
        // Create submitted applications with revenue (one per business user)
        console.log('💰 Creating submitted applications with revenue tracking...');
        
        for (let i = 0; i < businessUsers.length; i++) {
            const user = businessUsers[i];
            const applicationId = 1001 + i;
            const submittedAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
            
            // First two applications are completed with revenue, third is pending
            const status = i < 2 ? 'completed' : 'pending_offers';
            const revenueCollected = i < 2 ? 25.00 : 0.00;
            const offersCount = i < 2 ? (i + 2) : 0; // 2 and 3 offers for completed apps
            const purchasedBy = i < 2 ? [2001 + i] : []; // Different banks purchase
            
            const auctionEndTime = new Date(submittedAt.getTime() + 48 * 60 * 60 * 1000);
            const offerSelectionEndTime = new Date(submittedAt.getTime() + 72 * 60 * 60 * 1000);
            
            await client.query(`
                INSERT INTO submitted_applications (
                    application_id, application_type, business_user_id, status,
                    revenue_collected, offers_count, purchased_by, submitted_at,
                    auction_end_time, offer_selection_end_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                applicationId, 'pos', user.user_id, status,
                revenueCollected, offersCount, purchasedBy, submittedAt,
                auctionEndTime, offerSelectionEndTime
            ]);
            
            // Create revenue record for completed applications
            if (status === 'completed') {
                const bankUserId = 2001 + i;
                await client.query(`
                    INSERT INTO application_revenue (application_id, bank_user_id, amount, transaction_type)
                    VALUES ($1, $2, $3, 'lead_purchase')
                `, [applicationId, bankUserId, 25.00]);
            }
        }
        
        console.log(`✅ Created ${businessUsers.length} submitted applications`);
        
        // Show comprehensive summary
        const summary = await client.query(`
            SELECT 
                COUNT(*) as total_applications,
                SUM(revenue_collected) as total_revenue,
                COUNT(CASE WHEN revenue_collected > 0 THEN 1 END) as revenue_generating_apps,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_apps,
                COUNT(CASE WHEN status = 'pending_offers' THEN 1 END) as pending_apps
            FROM submitted_applications
        `);
        
        const data = summary.rows[0];
        console.log('\n📊 Revenue Test Data Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${parseFloat(data.total_revenue || 0).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Pending Applications: ${data.pending_apps}`);
        
        // Show business user summary
        const businessSummary = await client.query(`
            SELECT 
                bu.user_id,
                bu.trade_name,
                sa.status,
                sa.revenue_collected
            FROM business_users bu
            JOIN submitted_applications sa ON bu.user_id = sa.business_user_id
            WHERE bu.user_id IN (1001, 1002, 1003)
            ORDER BY bu.user_id
        `);
        
        console.log('\n👥 Business Users & Applications:');
        businessSummary.rows.forEach(row => {
            console.log(`${row.trade_name} (ID: ${row.user_id}): ${row.status}, SAR ${parseFloat(row.revenue_collected || 0).toFixed(2)}`);
        });
        
        // Show bank performance
        const bankPerformance = await client.query(`
            SELECT 
                bu.entity_name,
                COUNT(ar.id) as purchases,
                SUM(ar.amount) as revenue_generated
            FROM bank_users bu
            LEFT JOIN application_revenue ar ON bu.user_id = ar.bank_user_id
            WHERE bu.user_id IN (2001, 2002, 2003)
            GROUP BY bu.user_id, bu.entity_name
            ORDER BY revenue_generated DESC NULLS LAST
        `);
        
        console.log('\n🏦 Bank Performance:');
        bankPerformance.rows.forEach(bank => {
            console.log(`${bank.entity_name}: ${bank.purchases} purchases, SAR ${parseFloat(bank.revenue_generated || 0).toFixed(2)} revenue`);
        });
        
        console.log('\n🎉 Simple revenue test data created successfully!');
        console.log('💡 Now you can view the revenue analytics in the admin dashboard');
        console.log('📋 25 SAR Revenue Rule is Active:');
        console.log('   • All purchased applications automatically generate 25 SAR');
        console.log('   • Database triggers ensure future purchases follow this rule');
        console.log('   • Revenue analytics will show real data from these transactions');
        
    } catch (error) {
        console.error('❌ Error creating simple revenue test data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    createSimpleRevenueTest()
        .then(() => {
            console.log('🎉 Simple revenue test data creation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createSimpleRevenueTest };

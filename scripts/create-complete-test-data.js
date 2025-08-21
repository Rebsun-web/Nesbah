const pool = require('../src/lib/db.cjs');

async function createCompleteTestData() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Creating complete test data with all required fields...');
        
        // Clear existing test data first
        console.log('🧹 Clearing existing test data...');
        await client.query('DELETE FROM application_revenue WHERE application_id IN (1001, 1002, 1003, 1004, 1005)');
        await client.query('DELETE FROM submitted_applications WHERE application_id IN (1001, 1002, 1003, 1004, 1005)');
        await client.query('DELETE FROM pos_application WHERE application_id IN (1001, 1002, 1003, 1004, 1005)');
        await client.query('DELETE FROM business_users WHERE cr_national_number IN (\'4030000101\', \'4030000102\', \'4030000103\', \'4030000104\', \'4030000105\')');
        await client.query('DELETE FROM bank_users WHERE user_id IN (2001, 2002, 2003)');
        await client.query('DELETE FROM users WHERE user_id IN (1001, 1002, 1003, 1004, 1005, 2001, 2002, 2003)');
        console.log('✅ Cleared existing test data');
        
        // Create business users with complete user information
        console.log('👥 Creating business users...');
        const businessUsers = [
            {
                // User fields
                user_id: 1001,
                email: 'admin@alriyadh-trading.sa',
                password: 'hashedpassword123',
                user_type: 'business_user',
                entity_name: 'Al-Riyadh Trading Co.',
                status: 'active',
                
                // Business Information
                trade_name: 'Al-Riyadh Trading Co.',
                cr_number: 'CR001-2020',
                cr_national_number: '4030000101',
                sector: 'Retail & Trading',
                city: 'Riyadh',
                address: 'King Fahd Road, Al-Olaya District, Riyadh 12211',
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567',
                has_ecommerce: true,
                
                // Registration Details (Wathiq API)
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2020-01-15',
                confirmation_date_gregorian: '2020-01-20',
                management_structure: 'Board of Directors',
                management_managers: ['Ahmed Al-Rashid - CEO', 'Sarah Al-Zahra - CFO'],
                store_url: 'https://alriyadh-trading.sa',
                
                // Financial Information
                cr_capital: 600000,
                cash_capital: 500000,
                in_kind_capital: 100000,
                
                // Contact Info
                contact_info: {
                    phone: '+966501234567',
                    email: 'info@alriyadh-trading.sa',
                    website: 'www.alriyadh-trading.sa'
                }
            },
            {
                user_id: 1002,
                email: 'contact@jeddah-electronics.sa',
                password: 'hashedpassword456',
                user_type: 'business_user',
                entity_name: 'Jeddah Electronics Ltd.',
                status: 'active',
                
                trade_name: 'Jeddah Electronics Ltd.',
                cr_number: 'CR002-2019',
                cr_national_number: '4030000102',
                sector: 'Electronics & Technology',
                city: 'Jeddah',
                address: 'Tahlia Street, Al-Zahra District, Jeddah 21441',
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321',
                has_ecommerce: true,
                
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2019-06-10',
                confirmation_date_gregorian: '2019-06-15',
                management_structure: 'General Manager',
                management_managers: ['Fatima Al-Zahra - General Manager'],
                store_url: 'https://jeddah-electronics.sa',
                
                cr_capital: 900000,
                cash_capital: 750000,
                in_kind_capital: 150000,
                
                contact_info: {
                    phone: '+966507654321',
                    email: 'contact@jeddah-electronics.sa',
                    website: 'www.jeddah-electronics.sa'
                }
            },
            {
                user_id: 1003,
                email: 'info@dammam-retail.sa',
                password: 'hashedpassword789',
                user_type: 'business_user',
                entity_name: 'Dammam Retail Solutions',
                status: 'active',
                
                trade_name: 'Dammam Retail Solutions',
                cr_number: 'CR003-2021',
                cr_national_number: '4030000103',
                sector: 'Retail & Services',
                city: 'Dammam',
                address: 'King Khalid Street, Dammam 31441',
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543',
                has_ecommerce: false,
                
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2021-03-20',
                confirmation_date_gregorian: '2021-03-25',
                management_structure: 'Partnership',
                management_managers: ['Omar Al-Mansouri - Partner', 'Layla Al-Qahtani - Partner'],
                store_url: null,
                
                cr_capital: 480000,
                cash_capital: 400000,
                in_kind_capital: 80000,
                
                contact_info: {
                    phone: '+966509876543',
                    email: 'info@dammam-retail.sa',
                    website: 'www.dammam-retail.sa'
                }
            }
        ];
        
        // Create users and business_users
        for (const user of businessUsers) {
            // Create user record
            await client.query(`
                INSERT INTO users (user_id, email, password, user_type, entity_name, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [user.user_id, user.email, user.password, user.user_type, user.entity_name, user.status]);
            
            // Create business_users record
            await client.query(`
                INSERT INTO business_users (
                    user_id, cr_national_number, cr_number, trade_name, address, sector,
                    registration_status, cash_capital, in_kind_capital, contact_info,
                    store_url, form_name, issue_date_gregorian, confirmation_date_gregorian,
                    has_ecommerce, management_structure, management_managers, cr_capital,
                    city, contact_person, contact_person_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            `, [
                user.user_id, user.cr_national_number, user.cr_number, user.trade_name,
                user.address, user.sector, user.status, user.cash_capital,
                user.in_kind_capital, JSON.stringify(user.contact_info), user.store_url,
                user.form_name, user.issue_date_gregorian, user.confirmation_date_gregorian,
                user.has_ecommerce, user.management_structure, JSON.stringify(user.management_managers),
                user.cr_capital, user.city, user.contact_person, user.contact_person_number
            ]);
        }
        
        console.log(`✅ Created ${businessUsers.length} business users with complete information`);
        
        // Create bank users with complete information
        console.log('🏦 Creating bank users...');
        const bankUsers = [
            {
                // User fields
                user_id: 2001,
                email: 'partnerships@snb.sa',
                password: 'hashedpassword001',
                user_type: 'bank_user',
                entity_name: 'Saudi National Bank',
                status: 'active',
                
                // Bank Information
                credit_limit: 50000.00,
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567'
            },
            {
                user_id: 2002,
                email: 'business@riyad-bank.sa',
                password: 'hashedpassword002',
                user_type: 'bank_user',
                entity_name: 'Riyad Bank',
                status: 'active',
                
                credit_limit: 75000.00,
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321'
            },
            {
                user_id: 2003,
                email: 'corporate@anb.sa',
                password: 'hashedpassword003',
                user_type: 'bank_user',
                entity_name: 'Arab National Bank',
                status: 'active',
                
                credit_limit: 100000.00,
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543'
            }
        ];
        
        // Create bank users
        for (const user of bankUsers) {
            // Create user record
            await client.query(`
                INSERT INTO users (user_id, email, password, user_type, entity_name, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [user.user_id, user.email, user.password, user.user_type, user.entity_name, user.status]);
            
            // Create bank_users record
            await client.query(`
                INSERT INTO bank_users (user_id, entity_name, credit_limit, contact_person, contact_person_number)
                VALUES ($1, $2, $3, $4, $5)
            `, [user.user_id, user.entity_name, user.credit_limit, user.contact_person, user.contact_person_number]);
        }
        
        console.log(`✅ Created ${bankUsers.length} bank users with complete information`);
        
        // Create POS applications (one per business user)
        console.log('📱 Creating POS applications (one per business user)...');
        const now = new Date();
        
        for (let i = 0; i < businessUsers.length; i++) {
            const user = businessUsers[i];
            const applicationId = 1001 + i;
            const submittedAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
            
            await client.query(`
                INSERT INTO pos_application (application_id, user_id, status, submitted_at)
                VALUES ($1, $2, $3, $4)
            `, [applicationId, user.user_id, 'submitted', submittedAt]);
        }
        
        console.log(`✅ Created ${businessUsers.length} POS applications`);
        
        // Create submitted applications with revenue (one per business user)
        console.log('💰 Creating submitted applications with revenue tracking...');
        const submittedApplications = [];
        
        for (let i = 0; i < businessUsers.length; i++) {
            const user = businessUsers[i];
            const applicationId = 1001 + i;
            const submittedAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
            
            // First two applications are completed with revenue, third is pending
            const status = i < 2 ? 'completed' : 'pending_offers';
            const revenueCollected = i < 2 ? 25.00 : 0.00;
            const offersCount = i < 2 ? (i + 2) : 0; // 2 and 3 offers for completed apps
            const purchasedBy = i < 2 ? [2001 + i] : []; // Different banks purchase
            
            const app = {
                application_id: applicationId,
                application_type: 'pos',
                business_user_id: user.user_id,
                status: status,
                revenue_collected: revenueCollected,
                offers_count: offersCount,
                purchased_by: purchasedBy,
                submitted_at: submittedAt
            };
            
            submittedApplications.push(app);
            
            const auctionEndTime = new Date(submittedAt.getTime() + 48 * 60 * 60 * 1000);
            const offerSelectionEndTime = new Date(submittedAt.getTime() + 72 * 60 * 60 * 1000);
            
            await client.query(`
                INSERT INTO submitted_applications (
                    application_id, application_type, business_user_id, status,
                    revenue_collected, offers_count, purchased_by, submitted_at,
                    auction_end_time, offer_selection_end_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                app.application_id, app.application_type, app.business_user_id, app.status,
                app.revenue_collected, app.offers_count, app.purchased_by, app.submitted_at,
                auctionEndTime, offerSelectionEndTime
            ]);
        }
        
        console.log(`✅ Created ${submittedApplications.length} submitted applications`);
        
        // Create application_revenue records for completed applications
        console.log('💵 Creating revenue records...');
        const completedApps = submittedApplications.filter(app => app.status === 'completed');
        
        for (const app of completedApps) {
            const bankUserId = app.purchased_by[0];
            await client.query(`
                INSERT INTO application_revenue (application_id, bank_user_id, amount, transaction_type)
                VALUES ($1, $2, $3, 'lead_purchase')
            `, [app.application_id, bankUserId, 25.00]);
        }
        
        console.log(`✅ Created revenue records for ${completedApps.length} completed applications`);
        
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
        console.log('\n📊 Complete Test Data Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${parseFloat(data.total_revenue || 0).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Pending Applications: ${data.pending_apps}`);
        
        // Show user summary
        const userSummary = await client.query(`
            SELECT 
                u.user_type,
                COUNT(*) as count
            FROM users u
            WHERE u.user_id IN (1001, 1002, 1003, 2001, 2002, 2003)
            GROUP BY u.user_type
        `);
        
        console.log('\n👥 User Summary:');
        userSummary.rows.forEach(row => {
            console.log(`${row.user_type}: ${row.count} users`);
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
            ORDER BY revenue_generated DESC
        `);
        
        console.log('\n🏦 Bank Performance:');
        bankPerformance.rows.forEach(bank => {
            console.log(`${bank.entity_name}: ${bank.purchases} purchases, SAR ${parseFloat(bank.revenue_generated || 0).toFixed(2)} revenue`);
        });
        
        console.log('\n🎉 Complete test data created successfully!');
        console.log('💡 You can now view the revenue analytics in the admin dashboard');
        console.log('📋 Data includes:');
        console.log('   • Complete user profiles (business & bank users)');
        console.log('   • Realistic business information with all Wathiq API fields');
        console.log('   • POS applications with revenue tracking');
        console.log('   • Bank purchases generating 25 SAR revenue each');
        console.log('   • Revenue analytics ready for display');
        
    } catch (error) {
        console.error('❌ Error creating complete test data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    createCompleteTestData()
        .then(() => {
            console.log('🎉 Complete test data creation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createCompleteTestData };

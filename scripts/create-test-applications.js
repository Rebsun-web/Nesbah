const pool = require('../src/lib/db.cjs');

async function createTestApplications() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Creating test applications with all required fields...');
        
        // Clear existing test data first
        console.log('🧹 Clearing existing test data...');
        await client.query('DELETE FROM application_revenue WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM submitted_applications WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM pos_application WHERE application_id IN (1001, 1002, 1003)');
        await client.query('DELETE FROM business_users WHERE cr_national_number IN (\'4030000101\', \'4030000102\', \'4030000103\')');
        await client.query('DELETE FROM users WHERE user_id IN (1001, 1002, 1003)');
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
        console.log('✅ Created users');
        
        // First, let's create some business users with all required fields
        const businessUsers = [
            {
                user_id: 1001,
                cr_national_number: '4030000101',
                cr_number: 'CR001',
                trade_name: 'Al-Riyadh Trading Co.',
                address: 'King Fahd Road, Riyadh',
                sector: 'Retail & Trading',
                registration_status: 'active',
                cash_capital: 500000,
                in_kind_capital: 100000,
                contact_info: {
                    phone: '+966501234567',
                    email: 'info@alriyadh.sa',
                    website: 'www.alriyadh.sa'
                },
                store_url: 'https://alriyadh.sa',
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2020-01-15',
                confirmation_date_gregorian: '2020-01-20',
                has_ecommerce: true,
                management_structure: 'Board of Directors',
                management_managers: ['Ahmed Al-Rashid', 'Sarah Al-Zahra'],
                cr_capital: 600000,
                city: 'Riyadh',
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567'
            },
            {
                user_id: 1002,
                cr_national_number: '4030000102',
                cr_number: 'CR002',
                trade_name: 'Jeddah Electronics Ltd.',
                address: 'Tahlia Street, Jeddah',
                sector: 'Electronics & Technology',
                registration_status: 'active',
                cash_capital: 750000,
                in_kind_capital: 150000,
                contact_info: {
                    phone: '+966507654321',
                    email: 'info@jeddah-elec.sa',
                    website: 'www.jeddah-elec.sa'
                },
                store_url: 'https://jeddah-elec.sa',
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2019-06-10',
                confirmation_date_gregorian: '2019-06-15',
                has_ecommerce: true,
                management_structure: 'General Manager',
                management_managers: ['Fatima Al-Zahra'],
                cr_capital: 900000,
                city: 'Jeddah',
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321'
            },
            {
                user_id: 1003,
                cr_national_number: '4030000103',
                cr_number: 'CR003',
                trade_name: 'Dammam Retail Solutions',
                address: 'King Khalid Street, Dammam',
                sector: 'Retail & Services',
                registration_status: 'active',
                cash_capital: 400000,
                in_kind_capital: 80000,
                contact_info: {
                    phone: '+966509876543',
                    email: 'info@dammam-retail.sa',
                    website: 'www.dammam-retail.sa'
                },
                store_url: 'https://dammam-retail.sa',
                form_name: 'Limited Liability Company',
                issue_date_gregorian: '2021-03-20',
                confirmation_date_gregorian: '2021-03-25',
                has_ecommerce: false,
                management_structure: 'Partnership',
                management_managers: ['Omar Al-Mansouri', 'Layla Al-Qahtani'],
                cr_capital: 480000,
                city: 'Dammam',
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543'
            }
        ];
        
        // Create business users
        for (const user of businessUsers) {
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
                user.address, user.sector, user.registration_status, user.cash_capital,
                user.in_kind_capital, JSON.stringify(user.contact_info), user.store_url,
                user.form_name, user.issue_date_gregorian, user.confirmation_date_gregorian,
                user.has_ecommerce, user.management_structure, JSON.stringify(user.management_managers),
                user.cr_capital, user.city, user.contact_person, user.contact_person_number
            ]);
        }
        
        console.log(`✅ Created ${businessUsers.length} business users`);
        
        // Create POS applications with all required fields
        const posApplications = [
            {
                application_id: 1001,
                user_id: 1001,
                status: 'submitted',
                trade_name: 'Al-Riyadh Trading Co.',
                cr_number: 'CR001',
                cr_national_number: '4030000101',
                legal_form: 'Limited Liability Company',
                registration_status: 'active',
                issue_date: '2020-01-15',
                city: 'Riyadh',
                activities: ['Retail Trading', 'Import/Export'],
                contact_info: {
                    phone: '+966501234567',
                    email: 'info@alriyadh.sa'
                },
                has_ecommerce: true,
                store_url: 'https://alriyadh.sa',
                cr_capital: 600000,
                cash_capital: 500000,
                management_structure: 'Board of Directors',
                management_names: ['Ahmed Al-Rashid', 'Sarah Al-Zahra'],
                contact_person: 'Ahmed Al-Rashid',
                contact_person_number: '+966501234567',
                number_of_pos_devices: 5,
                city_of_operation: 'Riyadh',
                own_pos_system: false,
                notes: 'Looking for competitive POS solutions'
            },
            {
                application_id: 1002,
                user_id: 1002,
                status: 'submitted',
                trade_name: 'Jeddah Electronics Ltd.',
                cr_number: 'CR002',
                cr_national_number: '4030000102',
                legal_form: 'Limited Liability Company',
                registration_status: 'active',
                issue_date: '2019-06-10',
                city: 'Jeddah',
                activities: ['Electronics Retail', 'Online Sales'],
                contact_info: {
                    phone: '+966507654321',
                    email: 'info@jeddah-elec.sa'
                },
                has_ecommerce: true,
                store_url: 'https://jeddah-elec.sa',
                cr_capital: 900000,
                cash_capital: 750000,
                management_structure: 'General Manager',
                management_names: ['Fatima Al-Zahra'],
                contact_person: 'Fatima Al-Zahra',
                contact_person_number: '+966507654321',
                number_of_pos_devices: 8,
                city_of_operation: 'Jeddah',
                own_pos_system: true,
                notes: 'Need to upgrade existing POS system'
            },
            {
                application_id: 1003,
                user_id: 1003,
                status: 'submitted',
                trade_name: 'Dammam Retail Solutions',
                cr_number: 'CR003',
                cr_national_number: '4030000103',
                legal_form: 'Limited Liability Company',
                registration_status: 'active',
                issue_date: '2021-03-20',
                city: 'Dammam',
                activities: ['Retail Services', 'Consulting'],
                contact_info: {
                    phone: '+966509876543',
                    email: 'info@dammam-retail.sa'
                },
                has_ecommerce: false,
                store_url: null,
                cr_capital: 480000,
                cash_capital: 400000,
                management_structure: 'Partnership',
                management_names: ['Omar Al-Mansouri', 'Layla Al-Qahtani'],
                contact_person: 'Omar Al-Mansouri',
                contact_person_number: '+966509876543',
                number_of_pos_devices: 3,
                city_of_operation: 'Dammam',
                own_pos_system: false,
                notes: 'First-time POS implementation'
            }
        ];
        
        // Create POS applications
        for (const app of posApplications) {
            await client.query(`
                INSERT INTO pos_application (
                    application_id, user_id, status, trade_name, cr_number, cr_national_number,
                    legal_form, registration_status, issue_date, city, activities, contact_info,
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure,
                    management_names, contact_person, contact_person_number,
                    number_of_pos_devices, city_of_operation, own_pos_system, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            `, [
                app.application_id, app.user_id, app.status, app.trade_name, app.cr_number,
                app.cr_national_number, app.legal_form, app.registration_status, app.issue_date,
                app.city, JSON.stringify(app.activities), JSON.stringify(app.contact_info),
                app.has_ecommerce, app.store_url, app.cr_capital, app.cash_capital,
                app.management_structure, JSON.stringify(app.management_names), app.contact_person,
                app.contact_person_number, app.number_of_pos_devices, app.city_of_operation,
                app.own_pos_system, app.notes
            ]);
        }
        
        console.log(`✅ Created ${posApplications.length} POS applications`);
        
        // Create submitted applications with different statuses and revenue
        const now = new Date();
        const submittedApplications = [
            {
                application_id: 1001,
                application_type: 'pos',
                business_user_id: 1001,
                status: 'completed',
                revenue_collected: 25.00,
                offers_count: 3,
                purchased_by: [1], // Bank user ID 1 purchased this
                submitted_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                application_id: 1002,
                application_type: 'pos',
                business_user_id: 1002,
                status: 'completed',
                revenue_collected: 25.00,
                offers_count: 2,
                purchased_by: [2],
                submitted_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                application_id: 1003,
                application_type: 'pos',
                business_user_id: 1003,
                status: 'pending_offers',
                revenue_collected: 0.00,
                offers_count: 0,
                purchased_by: [],
                submitted_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
            }
        ];
        
        // Insert submitted applications
        for (const app of submittedApplications) {
            const auctionEndTime = new Date(app.submitted_at.getTime() + 48 * 60 * 60 * 1000);
            const offerSelectionEndTime = new Date(app.submitted_at.getTime() + 72 * 60 * 60 * 1000);
            
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
        console.log('\n📊 Test Applications Summary:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${parseFloat(data.total_revenue || 0).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Pending Applications: ${data.pending_apps}`);
        
        // Show daily trend
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
        
        console.log('\n🎉 Test applications created successfully!');
        console.log('💡 You can now view the revenue analytics in the admin dashboard');
        console.log('📋 Applications include all required fields:');
        console.log('   • Business Information (CR Number, Trade Name, etc.)');
        console.log('   • Financial Information (Capital, Revenue)');
        console.log('   • Contact Information (Phone, Email, Website)');
        console.log('   • POS Information (Devices, E-commerce, etc.)');
        console.log('   • Management Structure and Activities');
        
    } catch (error) {
        console.error('❌ Error creating test applications:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    createTestApplications()
        .then(() => {
            console.log('🎉 Test applications creation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestApplications };
#!/usr/bin/env node

const pool = require('../src/lib/db.cjs');
const bcrypt = require('bcrypt');

// Sample business data following Wathiq API structure
const businessUsersData = [
    {
        cr_national_number: '4030000001',
        cr_number: 'CR001',
        trade_name: 'Tech Solutions Arabia',
        address: 'King Fahd Road, Riyadh',
        sector: 'Technology, Software Development',
        registration_status: 'active',
        cash_capital: 500000,
        in_kind_capital: 100000,
        contact_info: {
            phone: '+966501234567',
            email: 'info@techsolutions.sa',
            website: 'www.techsolutions.sa'
        },
        store_url: 'https://techsolutions.sa',
        legal_form: 'Limited Liability Company',
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
        cr_national_number: '4030000002',
        cr_number: 'CR002',
        trade_name: 'Gulf Trading Co.',
        address: 'Prince Sultan Street, Jeddah',
        sector: 'Trading, Import/Export',
        registration_status: 'active',
        cash_capital: 1000000,
        in_kind_capital: 200000,
        contact_info: {
            phone: '+966502345678',
            email: 'contact@gulftrading.sa',
            website: 'www.gulftrading.sa'
        },
        store_url: null,
        legal_form: 'Joint Stock Company',
        issue_date_gregorian: '2019-03-10',
        confirmation_date_gregorian: '2019-03-15',
        has_ecommerce: false,
        management_structure: 'General Assembly',
        management_managers: ['Mohammed Al-Sayed', 'Fatima Al-Hassan'],
        cr_capital: 1200000,
        city: 'Jeddah',
        contact_person: 'Mohammed Al-Sayed',
        contact_person_number: '+966502345678'
    },
    {
        cr_national_number: '4030000003',
        cr_number: 'CR003',
        trade_name: 'Medina Construction Ltd.',
        address: 'King Abdullah Road, Medina',
        sector: 'Construction, Real Estate',
        registration_status: 'active',
        cash_capital: 2000000,
        in_kind_capital: 500000,
        contact_info: {
            phone: '+966503456789',
            email: 'info@medinaconstruction.sa',
            website: 'www.medinaconstruction.sa'
        },
        store_url: null,
        legal_form: 'Limited Liability Company',
        issue_date_gregorian: '2018-06-20',
        confirmation_date_gregorian: '2018-06-25',
        has_ecommerce: false,
        management_structure: 'Board of Directors',
        management_managers: ['Omar Al-Mansouri'],
        cr_capital: 2500000,
        city: 'Medina',
        contact_person: 'Omar Al-Mansouri',
        contact_person_number: '+966503456789'
    },
    {
        cr_national_number: '4030000004',
        cr_number: 'CR004',
        trade_name: 'Digital Marketing Pro',
        address: 'Olaya Street, Riyadh',
        sector: 'Marketing, Digital Services',
        registration_status: 'active',
        cash_capital: 300000,
        in_kind_capital: 50000,
        contact_info: {
            phone: '+966504567890',
            email: 'hello@digitalmarketingpro.sa',
            website: 'www.digitalmarketingpro.sa'
        },
        store_url: 'https://digitalmarketingpro.sa',
        legal_form: 'Sole Proprietorship',
        issue_date_gregorian: '2021-02-08',
        confirmation_date_gregorian: '2021-02-12',
        has_ecommerce: true,
        management_structure: 'Owner',
        management_managers: ['Layla Al-Qahtani'],
        cr_capital: 350000,
        city: 'Riyadh',
        contact_person: 'Layla Al-Qahtani',
        contact_person_number: '+966504567890'
    },
    {
        cr_national_number: '4030000005',
        cr_number: 'CR005',
        trade_name: 'Saudi Logistics Solutions',
        address: 'Industrial City, Dammam',
        sector: 'Logistics, Transportation',
        registration_status: 'active',
        cash_capital: 1500000,
        in_kind_capital: 300000,
        contact_info: {
            phone: '+966505678901',
            email: 'info@saudilogistics.sa',
            website: 'www.saudilogistics.sa'
        },
        store_url: null,
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2017-09-12',
        confirmation_date_gregorian: '2017-09-18',
        has_ecommerce: false,
        management_structure: 'Board of Directors',
        management_managers: ['Khalid Al-Dossary', 'Noura Al-Sabah'],
        cr_capital: 1800000,
        city: 'Dammam',
        contact_person: 'Khalid Al-Dossary',
        contact_person_number: '+966505678901'
    },
    {
        cr_national_number: '4030000006',
        cr_number: 'CR006',
        trade_name: 'Green Energy Saudi',
        address: 'King Abdulaziz Road, Tabuk',
        sector: 'Energy, Renewable Energy',
        registration_status: 'active',
        cash_capital: 3000000,
        in_kind_capital: 800000,
        contact_info: {
            phone: '+966506789012',
            email: 'contact@greenenergysaudi.sa',
            website: 'www.greenenergysaudi.sa'
        },
        store_url: null,
        form_name: 'Joint Stock Company',
        issue_date_gregorian: '2020-11-05',
        confirmation_date_gregorian: '2020-11-10',
        has_ecommerce: false,
        management_structure: 'General Assembly',
        management_managers: ['Abdullah Al-Tamimi', 'Huda Al-Rashid'],
        cr_capital: 3800000,
        city: 'Tabuk',
        contact_person: 'Abdullah Al-Tamimi',
        contact_person_number: '+966506789012'
    },
    {
        cr_national_number: '4030000007',
        cr_number: 'CR007',
        trade_name: 'Culinary Delights Restaurant',
        address: 'Corniche Road, Jeddah',
        sector: 'Food & Beverage, Restaurant',
        registration_status: 'active',
        cash_capital: 400000,
        in_kind_capital: 100000,
        contact_info: {
            phone: '+966507890123',
            email: 'reservations@culinarydelights.sa',
            website: 'www.culinarydelights.sa'
        },
        store_url: 'https://culinarydelights.sa',
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2021-07-14',
        confirmation_date_gregorian: '2021-07-20',
        has_ecommerce: true,
        management_structure: 'Owner',
        management_managers: ['Chef Ali Al-Mahmoud'],
        cr_capital: 500000,
        city: 'Jeddah',
        contact_person: 'Chef Ali Al-Mahmoud',
        contact_person_number: '+966507890123'
    },
    {
        cr_national_number: '4030000008',
        cr_number: 'CR008',
        trade_name: 'Healthcare Innovations',
        address: 'King Faisal Road, Riyadh',
        sector: 'Healthcare, Medical Technology',
        registration_status: 'active',
        cash_capital: 2500000,
        in_kind_capital: 600000,
        contact_info: {
            phone: '+966508901234',
            email: 'info@healthcareinnovations.sa',
            website: 'www.healthcareinnovations.sa'
        },
        store_url: null,
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2019-12-03',
        confirmation_date_gregorian: '2019-12-08',
        has_ecommerce: false,
        management_structure: 'Board of Directors',
        management_managers: ['Dr. Samira Al-Zahra', 'Dr. Hassan Al-Rashid'],
        cr_capital: 3100000,
        city: 'Riyadh',
        contact_person: 'Dr. Samira Al-Zahra',
        contact_person_number: '+966508901234'
    },
    {
        cr_national_number: '4030000009',
        cr_number: 'CR009',
        trade_name: 'Fashion Forward Boutique',
        address: 'Tahlia Street, Riyadh',
        sector: 'Retail, Fashion',
        registration_status: 'active',
        cash_capital: 200000,
        in_kind_capital: 50000,
        contact_info: {
            phone: '+966509012345',
            email: 'style@fashionforward.sa',
            website: 'www.fashionforward.sa'
        },
        store_url: 'https://fashionforward.sa',
        form_name: 'Sole Proprietorship',
        issue_date_gregorian: '2022-01-20',
        confirmation_date_gregorian: '2022-01-25',
        has_ecommerce: true,
        management_structure: 'Owner',
        management_managers: ['Aisha Al-Mansouri'],
        cr_capital: 250000,
        city: 'Riyadh',
        contact_person: 'Aisha Al-Mansouri',
        contact_person_number: '+966509012345'
    },
    {
        cr_national_number: '4030000010',
        cr_number: 'CR010',
        trade_name: 'Automotive Excellence',
        address: 'Industrial Area, Jeddah',
        sector: 'Automotive, Manufacturing',
        registration_status: 'active',
        cash_capital: 5000000,
        in_kind_capital: 1200000,
        contact_info: {
            phone: '+966500123456',
            email: 'info@automotiveexcellence.sa',
            website: 'www.automotiveexcellence.sa'
        },
        store_url: null,
        form_name: 'Joint Stock Company',
        issue_date_gregorian: '2016-04-18',
        confirmation_date_gregorian: '2016-04-25',
        has_ecommerce: false,
        management_structure: 'General Assembly',
        management_managers: ['Yousef Al-Dossary', 'Mariam Al-Sabah'],
        cr_capital: 6200000,
        city: 'Jeddah',
        contact_person: 'Yousef Al-Dossary',
        contact_person_number: '+966500123456'
    },
    {
        cr_national_number: '4030000011',
        cr_number: 'CR011',
        trade_name: 'Educational Excellence Center',
        address: 'King Khalid Road, Abha',
        sector: 'Education, Training',
        registration_status: 'active',
        cash_capital: 800000,
        in_kind_capital: 200000,
        contact_info: {
            phone: '+966501234567',
            email: 'info@educationalexcellence.sa',
            website: 'www.educationalexcellence.sa'
        },
        store_url: 'https://educationalexcellence.sa',
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2020-08-30',
        confirmation_date_gregorian: '2020-09-05',
        has_ecommerce: true,
        management_structure: 'Board of Directors',
        management_managers: ['Dr. Fatima Al-Qahtani'],
        cr_capital: 1000000,
        city: 'Abha',
        contact_person: 'Dr. Fatima Al-Qahtani',
        contact_person_number: '+966501234567'
    },
    {
        cr_national_number: '4030000012',
        cr_number: 'CR012',
        trade_name: 'Agricultural Development Co.',
        address: 'Qassim Region, Buraydah',
        sector: 'Agriculture, Farming',
        registration_status: 'active',
        cash_capital: 1800000,
        in_kind_capital: 400000,
        contact_info: {
            phone: '+966502345678',
            email: 'contact@agriculturaldev.sa',
            website: 'www.agriculturaldev.sa'
        },
        store_url: null,
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2018-05-12',
        confirmation_date_gregorian: '2018-05-18',
        has_ecommerce: false,
        management_structure: 'Board of Directors',
        management_managers: ['Ahmed Al-Qassimi'],
        cr_capital: 2200000,
        city: 'Buraydah',
        contact_person: 'Ahmed Al-Qassimi',
        contact_person_number: '+966502345678'
    },
    {
        cr_national_number: '4030000013',
        cr_number: 'CR013',
        trade_name: 'Tourism & Hospitality Group',
        address: 'Corniche Road, Jeddah',
        sector: 'Tourism, Hospitality',
        registration_status: 'active',
        cash_capital: 3500000,
        in_kind_capital: 900000,
        contact_info: {
            phone: '+966503456789',
            email: 'reservations@tourismhospitality.sa',
            website: 'www.tourismhospitality.sa'
        },
        store_url: 'https://tourismhospitality.sa',
        form_name: 'Joint Stock Company',
        issue_date_gregorian: '2019-10-22',
        confirmation_date_gregorian: '2019-10-28',
        has_ecommerce: true,
        management_structure: 'General Assembly',
        management_managers: ['Omar Al-Hassan', 'Nadia Al-Rashid'],
        cr_capital: 4400000,
        city: 'Jeddah',
        contact_person: 'Omar Al-Hassan',
        contact_person_number: '+966503456789'
    },
    {
        cr_national_number: '4030000014',
        cr_number: 'CR014',
        trade_name: 'Financial Advisory Services',
        address: 'King Fahd Road, Riyadh',
        sector: 'Financial Services, Consulting',
        registration_status: 'active',
        cash_capital: 600000,
        in_kind_capital: 150000,
        contact_info: {
            phone: '+966504567890',
            email: 'info@financialadvisory.sa',
            website: 'www.financialadvisory.sa'
        },
        store_url: null,
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2021-03-15',
        confirmation_date_gregorian: '2021-03-20',
        has_ecommerce: false,
        management_structure: 'Board of Directors',
        management_managers: ['Khalid Al-Mansouri'],
        cr_capital: 750000,
        city: 'Riyadh',
        contact_person: 'Khalid Al-Mansouri',
        contact_person_number: '+966504567890'
    },
    {
        cr_national_number: '4030000015',
        cr_number: 'CR015',
        trade_name: 'Smart Home Solutions',
        address: 'Prince Mohammed Road, Dammam',
        sector: 'Technology, Smart Home',
        registration_status: 'active',
        cash_capital: 400000,
        in_kind_capital: 80000,
        contact_info: {
            phone: '+966505678901',
            email: 'hello@smarthomesolutions.sa',
            website: 'www.smarthomesolutions.sa'
        },
        store_url: 'https://smarthomesolutions.sa',
        form_name: 'Limited Liability Company',
        issue_date_gregorian: '2022-06-10',
        confirmation_date_gregorian: '2022-06-15',
        has_ecommerce: true,
        management_structure: 'Owner',
        management_managers: ['Sara Al-Dossary'],
        cr_capital: 480000,
        city: 'Dammam',
        contact_person: 'Sara Al-Dossary',
        contact_person_number: '+966505678901'
    }
];

// Sample bank data
const bankUsersData = [
    {
        email: 'sbn@bank.com',
        password: 'SBN@2024!',
        entity_name: 'Saudi British Bank (SABB)',
        credit_limit: 5000000,
        contact_person: 'Ahmed Al-Rashid',
        contact_person_number: '+966501234567'
    },
    {
        email: 'riyad@bank.com',
        password: 'Riyad@2024!',
        entity_name: 'Riyad Bank',
        credit_limit: 7500000,
        contact_person: 'Mohammed Al-Sayed',
        contact_person_number: '+966502345678'
    },
    {
        email: 'anb@bank.com',
        password: 'ANB@2024!',
        entity_name: 'Arab National Bank (ANB)',
        credit_limit: 6000000,
        contact_person: 'Khalid Al-Mansouri',
        contact_person_number: '+966503456789'
    },
    {
        email: 'aljazira@bank.com',
        password: 'AlJazira@2024!',
        entity_name: 'Bank AlJazira',
        credit_limit: 4000000,
        contact_person: 'Omar Al-Hassan',
        contact_person_number: '+966504567890'
    },
    {
        email: 'alrajhi@bank.com',
        password: 'AlRajhi@2024!',
        entity_name: 'Al Rajhi Bank',
        credit_limit: 10000000,
        contact_person: 'Yousef Al-Dossary',
        contact_person_number: '+966505678901'
    },
    {
        email: 'samba@bank.com',
        password: 'Samba@2024!',
        entity_name: 'Samba Financial Group',
        credit_limit: 8000000,
        contact_person: 'Abdullah Al-Tamimi',
        contact_person_number: '+966506789012'
    },
    {
        email: 'saudiinvestment@bank.com',
        password: 'SaudiInv@2024!',
        entity_name: 'Saudi Investment Bank',
        credit_limit: 3500000,
        contact_person: 'Hassan Al-Rashid',
        contact_person_number: '+966507890123'
    },
    {
        email: 'saudihollandi@bank.com',
        password: 'SaudiHollandi@2024!',
        entity_name: 'Saudi Hollandi Bank',
        credit_limit: 4500000,
        contact_person: 'Ali Al-Mahmoud',
        contact_person_number: '+966508901234'
    }
];

async function createSampleUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting sample user creation...');
        
        await client.query('BEGIN');

        // Create business users
        console.log('📊 Creating 15 business users...');
        for (const businessData of businessUsersData) {
            try {
                // Create user record first for business users
                const userResult = await client.query(
                    `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     RETURNING user_id`,
                    [
                        `${businessData.cr_number.toLowerCase().replace(/\s+/g, '')}@nesbah.com`,
                        'changeme123',
                        'business_user',
                        businessData.trade_name,
                        businessData.registration_status
                    ]
                );
                
                const userId = userResult.rows[0].user_id;

                // Create business user record with the user_id
                const businessUserResult = await client.query(
                    `INSERT INTO business_users (
                        user_id, cr_national_number, cr_number, trade_name, address, sector, 
                        registration_status, cash_capital, in_kind_capital, contact_info, 
                        store_url, form_name, issue_date_gregorian, confirmation_date_gregorian, 
                        has_ecommerce, management_structure, management_managers, cr_capital,
                        city, contact_person, contact_person_number
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    RETURNING user_id`,
                    [
                        userId,
                        businessData.cr_national_number,
                        businessData.cr_number,
                        businessData.trade_name,
                        businessData.address,
                        businessData.sector,
                        businessData.registration_status,
                        businessData.cash_capital,
                        businessData.in_kind_capital,
                        JSON.stringify(businessData.contact_info),
                        businessData.store_url,
                        businessData.form_name,
                        businessData.issue_date_gregorian,
                        businessData.confirmation_date_gregorian,
                        businessData.has_ecommerce,
                        businessData.management_structure,
                        JSON.stringify(businessData.management_managers),
                        businessData.cr_capital,
                        businessData.city,
                        businessData.contact_person,
                        businessData.contact_person_number
                    ]
                );
                
                console.log(`✅ Created business user: ${businessData.trade_name} (ID: ${userId})`);
                
            } catch (error) {
                if (error.code === '23505') { // unique_violation
                    console.log(`⚠️  Business user ${businessData.trade_name} already exists, skipping...`);
                } else {
                    console.error(`❌ Error creating business user ${businessData.trade_name}:`, error.message);
                }
            }
        }

        // Create bank users
        console.log('\n🏦 Creating 8 bank users...');
        for (const bankData of bankUsersData) {
            try {
                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(bankData.password, saltRounds);

                // Create user record first
                const userResult = await client.query(
                    `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     RETURNING user_id`,
                    [bankData.email, hashedPassword, 'bank_user', bankData.entity_name, 'active']
                );
                
                const userId = userResult.rows[0].user_id;

                // Create bank user record
                await client.query(
                    `INSERT INTO bank_users (user_id, email, credit_limit, contact_person, contact_person_number)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        userId,
                        bankData.email,
                        bankData.credit_limit,
                        bankData.contact_person,
                        bankData.contact_person_number
                    ]
                );
                
                console.log(`✅ Created bank user: ${bankData.entity_name} (ID: ${userId})`);
                
            } catch (error) {
                if (error.code === '23505') { // unique_violation
                    console.log(`⚠️  Bank user ${bankData.entity_name} already exists, skipping...`);
                } else {
                    console.error(`❌ Error creating bank user ${bankData.entity_name}:`, error.message);
                }
            }
        }

        await client.query('COMMIT');
        console.log('\n🎉 Sample users created successfully!');
        
        // Show summary
        const businessCount = await client.query('SELECT COUNT(*) FROM business_users');
        const bankCount = await client.query('SELECT COUNT(*) FROM bank_users');
        
        console.log('\n📊 Summary:');
        console.log(`Business Users: ${businessCount.rows[0].count}`);
        console.log(`Bank Users: ${bankCount.rows[0].count}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating sample users:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    createSampleUsers()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createSampleUsers };

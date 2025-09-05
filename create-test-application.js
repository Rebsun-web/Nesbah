#!/usr/bin/env node

/**
 * Test Application Creator
 * Creates a test application that expires in 10 minutes for testing background tasks
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTestApplication() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Creating test application that expires in 10 minutes...');
        
        // Create a test business user first
        const testEmail = `test-business-${Date.now()}@example.com`;
        const testCrNumber = `TEST-${Date.now()}`;
        const testTradeName = `Test Business ${new Date().toLocaleTimeString()}`;
        
        await client.query('BEGIN');
        
        // 1. Create test user
        const userRes = await client.query(
            `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING user_id`,
            [testEmail, '$2b$10$test', 'business_user', testTradeName, 'active']
        );
        const user_id = userRes.rows[0].user_id;
        
        // 2. Create test business user
        await client.query(
            `INSERT INTO business_users (
                user_id, cr_national_number, cr_number, trade_name, legal_form,
                registration_status, headquarter_city_name, issue_date_gregorian,
                confirmation_date_gregorian, contact_info, activities, has_ecommerce,
                store_url, cr_capital, cash_capital, management_structure,
                management_managers, address, sector, in_kind_capital, avg_capital,
                headquarter_district_name, headquarter_street_name, headquarter_building_number,
                city, contact_person, contact_person_number, is_verified, verification_date,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
            )`,
            [
                user_id, 
                `TEST-CR-${Date.now()}`, 
                testCrNumber, 
                testTradeName, 
                'LLC',
                'active',
                'Riyadh',
                new Date().toISOString().split('T')[0],
                new Date().toISOString().split('T')[0],
                JSON.stringify({ phone: '0500000000', email: testEmail }),
                JSON.stringify(['Retail']),
                false,
                null,
                100000,
                50000,
                'Standard',
                JSON.stringify(['Test Manager']),
                'Riyadh',
                'Technology',
                0,
                75000,
                'Central',
                'Test Street',
                '123',
                'Riyadh',
                'Test Contact',
                '0500000000',
                true,
                new Date().toISOString(),
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );
        
        // 3. Create test POS application with 10-minute expiration
        const submitted_at = new Date();
        const auction_end_time = new Date(submitted_at.getTime() + 10 * 60 * 1000); // 10 minutes from now
        
        const posAppResult = await client.query(
            `INSERT INTO pos_application (
                user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                legal_form, registration_status, issue_date_gregorian, city, 
                has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                contact_person, contact_person_number, number_of_pos_devices, 
                city_of_operation, auction_end_time, opened_by, purchased_by,
                pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                requested_financing_amount, preferred_repayment_period_months,
                offers_count, revenue_collected
            ) VALUES (
                $1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
            ) RETURNING application_id
            `,
            [
                user_id, 
                submitted_at, 
                'Test application for background task testing',
                null, // uploaded_document
                false, // own_pos_system
                null, // uploaded_filename
                null, // uploaded_mimetype
                testTradeName, 
                testCrNumber, 
                `TEST-CR-${Date.now()}`,
                'LLC', 
                'active', 
                new Date().toISOString().split('T')[0],
                'Riyadh', 
                false, // has_ecommerce
                null, // store_url
                100000, // cr_capital
                50000, // cash_capital
                'Standard', // management_structure
                'Test Contact', // contact_person
                '0500000000', // contact_person_number
                2, // number_of_pos_devices
                'Riyadh', // city_of_operation
                auction_end_time, // auction_end_time (10 minutes from now)
                [], // opened_by
                [], // purchased_by
                'Test POS Provider', // pos_provider_name
                12, // pos_age_duration_months
                50000, // avg_monthly_pos_sales
                100000, // requested_financing_amount
                24, // preferred_repayment_period_months
                0, // offers_count
                0 // revenue_collected
            ]
        );
        
        const application_id = posAppResult.rows[0].application_id;
        
        await client.query('COMMIT');
        
        console.log('✅ Test application created successfully!');
        console.log('📊 Application Details:');
        console.log(`   - Application ID: ${application_id}`);
        console.log(`   - Business: ${testTradeName}`);
        console.log(`   - Email: ${testEmail}`);
        console.log(`   - Status: live_auction`);
        console.log(`   - Submitted: ${submitted_at.toLocaleString()}`);
        console.log(`   - Expires: ${auction_end_time.toLocaleString()}`);
        console.log(`   - Time until expiry: ${Math.round((auction_end_time - new Date()) / 1000 / 60)} minutes`);
        console.log('');
        console.log('🔍 What to watch for:');
        console.log('   1. Check admin dashboard - should show 1 live_auction');
        console.log('   2. Check bank portal - should show this application in incoming requests');
        console.log('   3. Wait 10 minutes and watch console for background task messages');
        console.log('   4. After 10 minutes, status should change to "ignored" (no offers)');
        console.log('   5. Application should disappear from bank portal incoming requests');
        console.log('');
        console.log('⏰ Background tasks run every 5 minutes, so status change might take up to 5 minutes after expiry');
        
        return {
            application_id,
            user_id,
            testEmail,
            testTradeName,
            submitted_at,
            auction_end_time
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating test application:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script if called directly
if (require.main === module) {
    createTestApplication()
        .then((result) => {
            console.log('🎉 Test application creation completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test application creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestApplication };

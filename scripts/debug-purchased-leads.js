require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugPurchasedLeads() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Debugging purchased leads issue...\n');
        
        // Check all bank users
        const bankUsersResult = await client.query(`
            SELECT 
                u.user_id,
                u.entity_name,
                u.user_type,
                u.account_status
            FROM users u
            WHERE u.user_type IN ('bank_user', 'bank_employee')
            ORDER BY u.user_id
        `);
        
        console.log('📊 Bank users in the system:');
        bankUsersResult.rows.forEach(user => {
            console.log(`  - User ID: ${user.user_id}, Name: ${user.entity_name}, Type: ${user.user_type}, Status: ${user.account_status}`);
        });
        
        // Check all offers
        const offersResult = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.bank_user_id,
                ao.submitted_by_user_id,
                ao.status,
                ao.submitted_at,
                u.entity_name as bank_name
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            ORDER BY ao.submitted_at
        `);
        
        console.log('\n📊 All offers in the system:');
        offersResult.rows.forEach(offer => {
            console.log(`  - Offer ${offer.offer_id}: App ${offer.submitted_application_id}, Bank ID: ${offer.bank_user_id}, Submitted by: ${offer.submitted_by_user_id}, Bank: ${offer.bank_name}, Status: ${offer.status}`);
        });
        
        // Check all applications and their purchased_by status
        const appsResult = await client.query(`
            SELECT 
                pa.application_id,
                pa.user_id,
                pa.status,
                pa.purchased_by,
                pa.offers_count,
                pa.revenue_collected,
                bu.trade_name as business_name
            FROM pos_application pa
            JOIN business_users bu ON pa.user_id = bu.user_id
            ORDER BY pa.application_id
        `);
        
        console.log('\n📊 All applications and their purchase status:');
        appsResult.rows.forEach(app => {
            console.log(`  - App ${app.application_id}: Business: ${app.business_name}, Status: ${app.status}, Purchased_by: ${app.purchased_by}, Offers_count: ${app.offers_count}, Revenue: ${app.revenue_collected}`);
        });
        
        // Test the exact query from the API
        console.log('\n🔍 Testing the exact API query for user ID 737:');
        const testQueryResult = await client.query(
            `SELECT DISTINCT
                pa.application_id,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                bu.trade_name,
                pa.contact_person,
                pa.contact_person_number,
                u.email as business_contact_email,
                ao.submitted_at as offer_submitted_at,
                ao.status as offer_status,
                CASE 
                    WHEN $1 = ANY(pa.purchased_by) THEN 'purchased'
                    WHEN EXISTS (SELECT 1 FROM application_offers WHERE submitted_application_id = pa.application_id AND submitted_by_user_id = $1) THEN 'offer_submitted'
                    ELSE 'unknown'
                END as lead_status
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             LEFT JOIN application_offers ao ON ao.submitted_application_id = pa.application_id AND ao.submitted_by_user_id = $1
             WHERE $1 = ANY(pa.purchased_by) 
                OR EXISTS (SELECT 1 FROM application_offers WHERE submitted_application_id = pa.application_id AND submitted_by_user_id = $1)
             ORDER BY pa.submitted_at DESC`,
            [737]
        );
        
        console.log(`\n📊 Query results for user ID 737: ${testQueryResult.rows.length} rows`);
        testQueryResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. App ${row.application_id}: ${row.trade_name}, Status: ${row.status}, Lead Status: ${row.lead_status}`);
        });
        
        // Check if there's a mismatch in user IDs
        console.log('\n🔍 Checking for user ID mismatches...');
        const mismatchResult = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.bank_user_id,
                ao.submitted_by_user_id,
                CASE 
                    WHEN ao.bank_user_id = ao.submitted_by_user_id THEN 'match'
                    ELSE 'mismatch'
                END as id_match,
                u1.entity_name as bank_user_name,
                u2.entity_name as submitted_by_name
            FROM application_offers ao
            JOIN users u1 ON ao.bank_user_id = u1.user_id
            JOIN users u2 ON ao.submitted_by_user_id = u2.user_id
            ORDER BY ao.offer_id
        `);
        
        console.log('\n📊 User ID consistency check:');
        mismatchResult.rows.forEach(row => {
            console.log(`  - Offer ${row.offer_id}: Bank User ID: ${row.bank_user_id} (${row.bank_user_name}), Submitted By ID: ${row.submitted_by_user_id} (${row.submitted_by_name}), Match: ${row.id_match}`);
        });
        
    } catch (error) {
        console.error('❌ Error debugging purchased leads:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugPurchasedLeads().catch(console.error);

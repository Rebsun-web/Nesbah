const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkApplication7FullData() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking full data for Application ID 7...\n');
        
        // Get complete application data
        const appQuery = `
            SELECT 
                pa.*,
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.sector,
                bu.city,
                bu.activities,
                bu.contact_info,
                u.email as business_email
            FROM pos_application pa
            JOIN business_users bu ON pa.user_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            WHERE pa.application_id = 7
        `;
        
        const app = await client.query(appQuery);
        
        if (app.rows.length === 0) {
            console.log('❌ Application 7 not found');
            return;
        }
        
        const application = app.rows[0];
        
        console.log('📋 Complete Application Data:');
        console.log('=' .repeat(80));
        console.log(`Application ID: ${application.application_id}`);
        console.log(`Trade Name: ${application.trade_name}`);
        console.log(`CR Number: ${application.cr_number}`);
        console.log(`CR National Number: ${application.cr_national_number}`);
        console.log(`Sector: ${application.sector}`);
        console.log(`City: ${application.city}`);
        console.log(`Activities: ${application.activities}`);
        console.log(`Contact Info: ${application.contact_info}`);
        console.log(`Business Email: ${application.business_email}`);
        console.log('');
        
        console.log('📁 File Upload Information:');
        console.log('=' .repeat(80));
        console.log(`Uploaded Document: ${application.uploaded_document ? 'EXISTS' : 'NOT UPLOADED'}`);
        console.log(`Uploaded Filename: ${application.uploaded_filename || 'N/A'}`);
        console.log(`Uploaded MIME Type: ${application.uploaded_mimetype || 'N/A'}`);
        console.log('');
        
        console.log('📝 Application Details:');
        console.log('=' .repeat(80));
        console.log(`Notes: ${application.notes || 'N/A'}`);
        console.log(`POS Provider Name: ${application.pos_provider_name || 'N/A'}`);
        console.log(`POS Age Duration (months): ${application.pos_age_duration_months || 'N/A'}`);
        console.log(`Avg Monthly POS Sales: ${application.avg_monthly_pos_sales || 'N/A'}`);
        console.log(`Requested Financing Amount: ${application.requested_financing_amount || 'N/A'}`);
        console.log(`Preferred Repayment Period (months): ${application.preferred_repayment_period_months || 'N/A'}`);
        console.log(`Number of POS Devices: ${application.number_of_pos_devices || 'N/A'}`);
        console.log(`City of Operation: ${application.city_of_operation || 'N/A'}`);
        console.log(`Own POS System: ${application.own_pos_system || 'N/A'}`);
        console.log(`Has E-commerce: ${application.has_ecommerce || 'N/A'}`);
        console.log(`Store URL: ${application.store_url || 'N/A'}`);
        console.log('');
        
        console.log('👤 Contact Information:');
        console.log('=' .repeat(80));
        console.log(`Contact Person: ${application.contact_person || 'N/A'}`);
        console.log(`Contact Person Number: ${application.contact_person_number || 'N/A'}`);
        console.log('');
        
        console.log('🏦 Business User Data:');
        console.log('=' .repeat(80));
        console.log(`CR Capital: ${application.cr_capital || 'N/A'}`);
        console.log(`Cash Capital: ${application.cash_capital || 'N/A'}`);
        console.log(`In-Kind Capital: ${application.in_kind_capital || 'N/A'}`);
        console.log(`Legal Form: ${application.legal_form || 'N/A'}`);
        console.log(`Issue Date (Gregorian): ${application.issue_date_gregorian || 'N/A'}`);
        console.log(`Confirmation Date (Gregorian): ${application.confirmation_date_gregorian || 'N/A'}`);
        console.log(`Registration Status: ${application.registration_status || 'N/A'}`);
        console.log(`Management Structure: ${application.management_structure || 'N/A'}`);
        console.log(`Management Managers: ${application.management_managers || 'N/A'}`);
        console.log('');
        
        // Check if there are any offers with additional data
        const offersQuery = `
            SELECT 
                ao.*,
                u.entity_name as bank_name
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            WHERE ao.submitted_application_id = 7
            ORDER BY ao.submitted_at DESC
        `;
        
        const offers = await client.query(offersQuery);
        
        console.log('📋 Offers Information:');
        console.log('=' .repeat(80));
        console.log(`Total Offers: ${offers.rows.length}`);
        
        offers.rows.forEach((offer, index) => {
            console.log(`\nOffer ${index + 1}:`);
            console.log(`  Offer ID: ${offer.offer_id}`);
            console.log(`  Bank: ${offer.bank_name} (${offer.bank_user_id})`);
            console.log(`  Status: ${offer.status}`);
            console.log(`  Comment: ${offer.offer_comment || 'N/A'}`);
            console.log(`  Terms: ${offer.offer_terms || 'N/A'}`);
            console.log(`  Submitted At: ${offer.submitted_at}`);
            console.log(`  Expires At: ${offer.expires_at}`);
        });
        
        // Check for any file uploads in offers
        console.log('\n📁 Offer File Uploads:');
        console.log('=' .repeat(80));
        offers.rows.forEach((offer, index) => {
            console.log(`\nOffer ${index + 1} Files:`);
            console.log(`  Uploaded Document: ${offer.uploaded_document ? 'EXISTS' : 'NOT UPLOADED'}`);
            console.log(`  Filename: ${offer.uploaded_filename || 'N/A'}`);
            console.log(`  MIME Type: ${offer.uploaded_mimetype || 'N/A'}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking application data:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkApplication7FullData().catch(console.error);

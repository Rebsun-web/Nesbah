const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSampleOffer() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Creating sample offer for Saudi National Bank...\n');
        
        await client.query('BEGIN');

        // Get the bank user ID (Saudi National Bank)
        const bankUser = await client.query(`
            SELECT user_id FROM users 
            WHERE user_type = 'bank_user' AND entity_name = 'Saudi National Bank'
        `);
        
        if (bankUser.rows.length === 0) {
            console.log('❌ Saudi National Bank not found');
            return;
        }
        
        const bankUserId = bankUser.rows[0].user_id;
        console.log(`🏦 Found bank user ID: ${bankUserId}`);
        
        // Get the application that was purchased
        const application = await client.query(`
            SELECT application_id, trade_name 
            FROM pos_application 
            WHERE application_id = 2
        `);
        
        if (application.rows.length === 0) {
            console.log('❌ Application #2 not found');
            return;
        }
        
        const appId = application.rows[0].application_id;
        console.log(`📋 Found application #${appId}: ${application.rows[0].trade_name}`);
        
        // Create a sample offer with only existing columns
        const result = await client.query(`
            INSERT INTO application_offers (
                submitted_application_id,
                bank_user_id,
                offer_device_setup_fee,
                offer_transaction_fee_mada,
                offer_transaction_fee_visa_mc,
                offer_comment,
                bank_name,
                uploaded_filename,
                submitted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING offer_id
        `, [
            appId,
            bankUserId,
            150.00,  // offer_device_setup_fee
            1.5,     // offer_transaction_fee_mada
            2.5,     // offer_transaction_fee_visa_mc
            'Competitive rates for Tech Solutions Arabia. We offer excellent customer support and fast processing times.',
            'Saudi National Bank',
            'snb_offer_document.pdf',
            new Date()
        ]);
        
        const offerId = result.rows[0].offer_id;
        console.log(`✅ Created offer with ID: ${offerId}`);
        
        // Update the offers_count in pos_application
        await client.query(`
            UPDATE pos_application
            SET offers_count = (
                SELECT COUNT(*)
                FROM application_offers
                WHERE application_offers.submitted_application_id = pos_application.application_id
            )
            WHERE application_id = $1
        `, [appId]);
        
        console.log(`✅ Updated offers_count for application #${appId}`);
        
        // Verify the offer was created
        const verifyOffer = await client.query(`
            SELECT 
                ao.*,
                u.entity_name as bank_name,
                pa.trade_name as business_name
            FROM application_offers ao
            JOIN bank_users bu ON ao.bank_user_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            WHERE ao.offer_id = $1
        `, [offerId]);
        
        if (verifyOffer.rows.length > 0) {
            const offer = verifyOffer.rows[0];
            console.log('\n📋 Created offer details:');
            console.log(`  Offer ID: ${offer.offer_id}`);
            console.log(`  Application ID: ${offer.submitted_application_id}`);
            console.log(`  Business: ${offer.business_name}`);
            console.log(`  Bank: ${offer.bank_name}`);
            console.log(`  Device Setup Fee: ${offer.offer_device_setup_fee}`);
            console.log(`  Mada Fee: ${offer.offer_transaction_fee_mada}%`);
            console.log(`  Visa/MC Fee: ${offer.offer_transaction_fee_visa_mc}%`);
            console.log(`  Comment: ${offer.offer_comment}`);
            console.log(`  File: ${offer.uploaded_filename}`);
            console.log(`  Submitted: ${offer.submitted_at}`);
        }
        
        await client.query('COMMIT');
        console.log('\n✅ Sample offer created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating sample offer:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the creation
createSampleOffer()
    .then(() => {
        console.log('\n✅ Sample offer creation completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Sample offer creation failed:', error);
        process.exit(1);
    });

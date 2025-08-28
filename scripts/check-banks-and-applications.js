const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkBanksAndApplications() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking banks and available applications...\n');
        
        // Check all bank users
        const bankUsers = await client.query(`
            SELECT 
                bu.user_id,
                u.entity_name,
                bu.contact_person,
                bu.contact_person_number,
                u.email,
                u.user_type
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
            ORDER BY u.entity_name
        `);
        
        console.log(`🏦 Found ${bankUsers.rows.length} bank users:`);
        bankUsers.rows.forEach((bank, index) => {
            console.log(`  ${index + 1}. ${bank.entity_name} (ID: ${bank.user_id})`);
            console.log(`     Contact: ${bank.contact_person} (${bank.contact_person_number})`);
            console.log(`     Email: ${bank.email}`);
            console.log('');
        });
        
        // Check all live auction applications
        const liveApplications = await client.query(`
            SELECT 
                pa.application_id,
                pa.user_id,
                pa.status,
                pa.trade_name,
                pa.city,
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.opened_by,
                pa.purchased_by,
                bu.trade_name as business_name
            FROM pos_application pa
            JOIN business_users bu ON pa.user_id = bu.user_id
            WHERE pa.status = 'live_auction'
            ORDER BY pa.submitted_at DESC
        `);
        
        console.log(`📋 Found ${liveApplications.rows.length} live auction applications:`);
        liveApplications.rows.forEach((app, index) => {
            const timeLeft = app.auction_end_time ? 
                Math.round((new Date(app.auction_end_time) - new Date()) / (1000 * 60 * 60)) : 
                'No deadline set';
            
            console.log(`  ${index + 1}. Application #${app.application_id}`);
            console.log(`     Business: ${app.business_name} (${app.trade_name})`);
            console.log(`     City: ${app.city}`);
            console.log(`     Status: ${app.status}`);
            console.log(`     Submitted: ${app.submitted_at}`);
            console.log(`     Auction End: ${app.auction_end_time}`);
            console.log(`     Time Left: ${timeLeft} hours`);
            console.log(`     Offers Count: ${app.offers_count}`);
            console.log(`     Opened By: [${app.opened_by}]`);
            console.log(`     Purchased By: [${app.purchased_by}]`);
            console.log('');
        });
        
        // Check if there are any applications that banks can view
        if (liveApplications.rows.length > 0) {
            console.log('🔍 Checking which applications are visible to banks...');
            
            for (const app of liveApplications.rows) {
                console.log(`\n📊 Application #${app.application_id} visibility:`);
                
                // Check which banks have opened this application
                const openedByBanks = await client.query(`
                    SELECT u.entity_name, bu.user_id
                    FROM bank_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    WHERE bu.user_id = ANY($1)
                `, [app.opened_by]);
                
                console.log(`  Opened by: ${openedByBanks.rows.map(b => b.entity_name).join(', ') || 'None'}`);
                
                // Check which banks have purchased this application
                const purchasedByBanks = await client.query(`
                    SELECT u.entity_name, bu.user_id
                    FROM bank_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    WHERE bu.user_id = ANY($1)
                `, [app.purchased_by]);
                
                console.log(`  Purchased by: ${purchasedByBanks.rows.map(b => b.entity_name).join(', ') || 'None'}`);
                
                // Show which banks can still submit offers
                const allBanks = bankUsers.rows.map(b => b.user_id);
                const canSubmitOffers = allBanks.filter(bankId => 
                    !app.purchased_by.includes(bankId)
                );
                
                const canSubmitBanks = await client.query(`
                    SELECT u.entity_name, bu.user_id
                    FROM bank_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    WHERE bu.user_id = ANY($1)
                `, [canSubmitOffers]);
                
                console.log(`  Can still submit offers: ${canSubmitBanks.rows.map(b => b.entity_name).join(', ') || 'None'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking banks and applications:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkBanksAndApplications()
    .then(() => {
        console.log('\n✅ Banks and applications check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Banks and applications check failed:', error);
        process.exit(1);
    });

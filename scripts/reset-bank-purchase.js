const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetBankPurchase() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Resetting bank purchase status...\n');
        
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
        
        // Reset the purchase status for all applications
        const result = await client.query(`
            UPDATE pos_application
            SET purchased_by = array_remove(purchased_by, $1)
            WHERE $1 = ANY(purchased_by)
        `, [bankUserId]);
        
        console.log(`✅ Removed bank ${bankUserId} from ${result.rowCount} purchased applications`);
        
        // Check the updated application
        const updatedApp = await client.query(`
            SELECT application_id, status, trade_name, opened_by, purchased_by
            FROM pos_application 
            WHERE status = 'live_auction'
            ORDER BY submitted_at DESC
            LIMIT 1
        `);
        
        if (updatedApp.rows.length > 0) {
            const app = updatedApp.rows[0];
            console.log('\n📊 Updated application data:');
            console.log(`  Application ID: ${app.application_id}`);
            console.log(`  Status: ${app.status}`);
            console.log(`  Trade Name: ${app.trade_name}`);
            console.log(`  Opened By: [${app.opened_by}]`);
            console.log(`  Purchased By: [${app.purchased_by}]`);
        }
        
        await client.query('COMMIT');
        console.log('\n✅ Bank purchase reset completed successfully!');
        console.log('🏦 The bank should now see this application in their Incoming Requests.');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error resetting bank purchase:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the reset
resetBankPurchase()
    .then(() => {
        console.log('\n✅ Bank purchase reset completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Bank purchase reset failed:', error);
        process.exit(1);
    });

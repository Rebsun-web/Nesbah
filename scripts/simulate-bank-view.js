const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function simulateBankView() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Simulating bank viewing an application...\n');
        
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
        
        // Get the live auction application
        const application = await client.query(`
            SELECT application_id, status, trade_name 
            FROM pos_application 
            WHERE status = 'live_auction'
            ORDER BY submitted_at DESC
            LIMIT 1
        `);
        
        if (application.rows.length === 0) {
            console.log('❌ No live auction applications found');
            return;
        }
        
        const appId = application.rows[0].application_id;
        console.log(`📋 Found application #${appId}: ${application.rows[0].trade_name}`);
        
        // Simulate bank viewing the application by adding to opened_by array
        const result = await client.query(`
            UPDATE pos_application
            SET opened_by = array_append(opened_by, $1)
            WHERE application_id = $2
            AND NOT $1 = ANY(opened_by)
        `, [bankUserId, appId]);
        
        if (result.rowCount > 0) {
            console.log(`✅ Bank user ${bankUserId} has viewed application #${appId}`);
        } else {
            console.log(`ℹ️ Bank user ${bankUserId} has already viewed application #${appId}`);
        }
        
        // Check the updated application
        const updatedApp = await client.query(`
            SELECT application_id, status, trade_name, opened_by, purchased_by
            FROM pos_application 
            WHERE application_id = $1
        `, [appId]);
        
        console.log('\n📊 Updated application data:');
        console.log(`  Application ID: ${updatedApp.rows[0].application_id}`);
        console.log(`  Status: ${updatedApp.rows[0].status}`);
        console.log(`  Trade Name: ${updatedApp.rows[0].trade_name}`);
        console.log(`  Opened By: [${updatedApp.rows[0].opened_by}]`);
        console.log(`  Purchased By: [${updatedApp.rows[0].purchased_by}]`);
        
        await client.query('COMMIT');
        console.log('\n✅ Bank view simulation completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error simulating bank view:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the simulation
simulateBankView()
    .then(() => {
        console.log('\n✅ Bank view simulation completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Bank view simulation failed:', error);
        process.exit(1);
    });

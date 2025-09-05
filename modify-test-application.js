#!/usr/bin/env node

/**
 * Modify Test Application
 * Modifies an existing application to expire in 10 minutes for testing background tasks
 */

const { Pool } = require('pg');

// Database connection - using the same config as your app
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function modifyTestApplication() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Looking for existing applications to modify...');
        
        // Find an existing live_auction application
        const existingApps = await client.query(`
            SELECT application_id, trade_name, submitted_at, auction_end_time, status
            FROM pos_application 
            WHERE status = 'live_auction'
            ORDER BY submitted_at DESC
            LIMIT 5
        `);
        
        if (existingApps.rows.length === 0) {
            console.log('❌ No existing live_auction applications found.');
            console.log('💡 Please create an application first through the admin interface or business portal.');
            return;
        }
        
        console.log('📋 Found existing applications:');
        existingApps.rows.forEach((app, index) => {
            console.log(`   ${index + 1}. ID: ${app.application_id}, Business: ${app.trade_name}, Status: ${app.status}`);
        });
        
        // Use the first application
        const targetApp = existingApps.rows[0];
        console.log(`\n🎯 Modifying application ID: ${targetApp.application_id} (${targetApp.trade_name})`);
        
        // Set auction_end_time to 10 minutes from now
        const newAuctionEndTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        await client.query('BEGIN');
        
        // Update the application
        await client.query(
            `UPDATE pos_application 
             SET auction_end_time = $1, updated_at = NOW()
             WHERE application_id = $2`,
            [newAuctionEndTime, targetApp.application_id]
        );
        
        await client.query('COMMIT');
        
        console.log('✅ Test application modified successfully!');
        console.log('📊 Application Details:');
        console.log(`   - Application ID: ${targetApp.application_id}`);
        console.log(`   - Business: ${targetApp.trade_name}`);
        console.log(`   - Status: live_auction`);
        console.log(`   - Original expiry: ${targetApp.auction_end_time ? new Date(targetApp.auction_end_time).toLocaleString() : 'Not set'}`);
        console.log(`   - New expiry: ${newAuctionEndTime.toLocaleString()}`);
        console.log(`   - Time until expiry: ${Math.round((newAuctionEndTime - new Date()) / 1000 / 60)} minutes`);
        console.log('');
        console.log('🔍 What to watch for:');
        console.log('   1. Check admin dashboard - should show this application as live_auction');
        console.log('   2. Check bank portal - should show this application in incoming requests');
        console.log('   3. Wait 10 minutes and watch console for background task messages');
        console.log('   4. After 10 minutes, status should change to "ignored" (no offers)');
        console.log('   5. Application should disappear from bank portal incoming requests');
        console.log('');
        console.log('⏰ Background tasks run every 5 minutes, so status change might take up to 5 minutes after expiry');
        console.log('📱 You can also manually trigger status update via: curl -X POST http://localhost:3000/api/admin/applications/update-status');
        
        return {
            application_id: targetApp.application_id,
            trade_name: targetApp.trade_name,
            new_auction_end_time: newAuctionEndTime
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error modifying test application:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script if called directly
if (require.main === module) {
    modifyTestApplication()
        .then((result) => {
            console.log('🎉 Test application modification completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test application modification failed:', error);
            process.exit(1);
        });
}

module.exports = { modifyTestApplication };

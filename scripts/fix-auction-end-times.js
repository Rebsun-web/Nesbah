#!/usr/bin/env node

/**
 * Fix Auction End Times Script
 * This script identifies and fixes applications with incorrect auction_end_time values
 */

const { Pool } = require('pg');

console.log('🔧 Starting Auction End Time Fix Script...\n');

// Database configuration
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
} : {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function fixAuctionEndTimes() {
    let pool = null;
    
    try {
        console.log('📊 Connecting to database...');
        pool = new Pool(poolConfig);
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        // Step 1: Find applications with incorrect auction_end_time
        console.log('\n🔍 Step 1: Finding applications with incorrect auction_end_time...');
        
        const incorrectAppsQuery = `
            SELECT 
                sa.application_id,
                sa.auction_end_time as current_auction_end,
                pa.submitted_at,
                pa.submitted_at + INTERVAL '48 hours' as correct_auction_end,
                EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600 as hours_difference
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
            AND sa.auction_end_time IS NOT NULL
            AND ABS(EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) > 0.1
            ORDER BY ABS(EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) DESC
        `;
        
        const incorrectApps = await client.query(incorrectAppsQuery);
        
        if (incorrectApps.rows.length === 0) {
            console.log('✅ No applications with incorrect auction_end_time found!');
            client.release();
            return;
        }
        
        console.log(`📋 Found ${incorrectApps.rows.length} applications with incorrect auction_end_time:`);
        console.log('');
        
        incorrectApps.rows.forEach((app, index) => {
            const hoursDiff = Math.round(app.hours_difference * 100) / 100;
            const sign = hoursDiff > 0 ? '+' : '';
            console.log(`${index + 1}. Application ID: ${app.application_id}`);
            console.log(`   Submitted: ${app.submitted_at.toLocaleString()}`);
            console.log(`   Current auction_end: ${app.current_auction_end.toLocaleString()}`);
            console.log(`   Correct auction_end: ${app.correct_auction_end.toLocaleString()}`);
            console.log(`   Difference: ${sign}${hoursDiff} hours`);
            console.log('');
        });
        
        // Step 2: Ask for confirmation before fixing
        console.log('⚠️  WARNING: This will update the auction_end_time for all applications listed above.');
        console.log('   The correct time will be exactly 48 hours from the submitted_at timestamp.');
        console.log('');
        
        // In a real script, you might want to add user confirmation here
        // For now, we'll proceed with the fix
        
        console.log('🔧 Step 2: Fixing incorrect auction_end_time values...');
        
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const app of incorrectApps.rows) {
            try {
                // Update submitted_applications table
                await client.query(`
                    UPDATE submitted_applications 
                    SET auction_end_time = $1 
                    WHERE application_id = $2
                `, [app.correct_auction_end, app.application_id]);
                
                // Update pos_application table
                await client.query(`
                    UPDATE pos_application 
                    SET auction_end_time = $1 
                    WHERE application_id = $2
                `, [app.correct_auction_end, app.application_id]);
                
                console.log(`✅ Fixed Application ID ${app.application_id}`);
                fixedCount++;
                
            } catch (error) {
                console.error(`❌ Failed to fix Application ID ${app.application_id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 Fix Summary:');
        console.log(`   Total applications found: ${incorrectApps.rows.length}`);
        console.log(`   Successfully fixed: ${fixedCount}`);
        console.log(`   Failed to fix: ${errorCount}`);
        
        // Step 3: Verify the fixes
        console.log('\n🔍 Step 3: Verifying fixes...');
        
        const verificationQuery = `
            SELECT 
                sa.application_id,
                sa.auction_end_time as current_auction_end,
                pa.submitted_at,
                pa.submitted_at + INTERVAL '48 hours' as correct_auction_end,
                EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600 as hours_difference
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
            AND sa.auction_end_time IS NOT NULL
            AND ABS(EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) > 0.1
            ORDER BY ABS(EXTRACT(EPOCH FROM (sa.auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) DESC
        `;
        
        const verification = await client.query(verificationQuery);
        
        if (verification.rows.length === 0) {
            console.log('✅ Verification successful: All auction_end_time values are now correct!');
        } else {
            console.log(`⚠️  Warning: ${verification.rows.length} applications still have incorrect auction_end_time values`);
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error during auction end time fix:', error.message);
        
        if (pool) {
            try {
                await pool.end();
            } catch (endError) {
                console.error('❌ Failed to end pool:', endError.message);
            }
        }
        
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run the fix
fixAuctionEndTimes().then(() => {
    console.log('\n🎉 Auction end time fix script completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Auction end time fix script failed:', error);
    process.exit(1);
});

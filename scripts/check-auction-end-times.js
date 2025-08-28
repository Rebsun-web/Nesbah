#!/usr/bin/env node

/**
 * Check Auction End Times Script (Read-Only)
 * This script identifies applications with incorrect auction_end_time values without making changes
 */

const { Pool } = require('pg');

console.log('🔍 Starting Auction End Time Check Script (Read-Only)...\n');

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

async function checkAuctionEndTimes() {
    let pool = null;
    
    try {
        console.log('📊 Connecting to database...');
        pool = new Pool(poolConfig);
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        // Check 1: Find applications with incorrect auction_end_time
        console.log('\n🔍 Check 1: Applications with incorrect auction_end_time...');
        
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
            LIMIT 20
        `;
        
        const incorrectApps = await client.query(incorrectAppsQuery);
        
        if (incorrectApps.rows.length === 0) {
            console.log('✅ No applications with incorrect auction_end_time found!');
        } else {
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
        }
        
        // Check 2: Summary statistics
        console.log('📊 Check 2: Summary Statistics...');
        
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_live_auctions,
                COUNT(CASE WHEN auction_end_time IS NULL THEN 1 END) as missing_auction_end_time,
                COUNT(CASE WHEN auction_end_time IS NOT NULL THEN 1 END) as has_auction_end_time,
                COUNT(CASE WHEN ABS(EXTRACT(EPOCH FROM (auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) > 0.1 THEN 1 END) as incorrect_timing,
                COUNT(CASE WHEN ABS(EXTRACT(EPOCH FROM (auction_end_time - (pa.submitted_at + INTERVAL '48 hours')))/3600) <= 0.1 THEN 1 END) as correct_timing
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
        `;
        
        const summary = await client.query(summaryQuery);
        const stats = summary.rows[0];
        
        console.log(`   Total live auction applications: ${stats.total_live_auctions}`);
        console.log(`   Missing auction_end_time: ${stats.missing_auction_end_time}`);
        console.log(`   Has auction_end_time: ${stats.has_auction_end_time}`);
        console.log(`   Incorrect timing: ${stats.incorrect_timing}`);
        console.log(`   Correct timing: ${stats.correct_timing}`);
        
        // Check 3: Applications expiring soon (within next 2 hours)
        console.log('\n⏰ Check 3: Applications expiring soon (within next 2 hours)...');
        
        const expiringSoonQuery = `
            SELECT 
                sa.application_id,
                pa.trade_name,
                sa.auction_end_time,
                pa.submitted_at,
                EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
            AND sa.auction_end_time IS NOT NULL
            AND sa.auction_end_time > NOW()
            AND sa.auction_end_time <= NOW() + INTERVAL '2 hours'
            ORDER BY sa.auction_end_time ASC
        `;
        
        const expiringSoon = await client.query(expiringSoonQuery);
        
        if (expiringSoon.rows.length === 0) {
            console.log('   No applications expiring within the next 2 hours');
        } else {
            console.log(`   ${expiringSoon.rows.length} applications expiring soon:`);
            expiringSoon.rows.forEach((app, index) => {
                const hoursLeft = Math.round(app.hours_until_expiry * 100) / 100;
                console.log(`   ${index + 1}. App ID ${app.application_id} (${app.trade_name}): ${hoursLeft} hours left`);
            });
        }
        
        // Check 4: Recent applications (submitted in last 24 hours)
        console.log('\n📅 Check 4: Recent applications (submitted in last 24 hours)...');
        
        const recentAppsQuery = `
            SELECT 
                sa.application_id,
                pa.trade_name,
                pa.submitted_at,
                sa.auction_end_time,
                EXTRACT(EPOCH FROM (sa.auction_end_time - pa.submitted_at))/3600 as auction_duration_hours
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
            AND pa.submitted_at >= NOW() - INTERVAL '24 hours'
            ORDER BY pa.submitted_at DESC
            LIMIT 10
        `;
        
        const recentApps = await client.query(recentAppsQuery);
        
        if (recentApps.rows.length === 0) {
            console.log('   No applications submitted in the last 24 hours');
        } else {
            console.log(`   ${recentApps.rows.length} recent applications:`);
            recentApps.rows.forEach((app, index) => {
                const duration = Math.round(app.auction_duration_hours * 100) / 100;
                console.log(`   ${index + 1}. App ID ${app.application_id} (${app.trade_name})`);
                console.log(`      Submitted: ${app.submitted_at.toLocaleString()}`);
                console.log(`      Auction ends: ${app.auction_end_time.toLocaleString()}`);
                console.log(`      Duration: ${duration} hours (should be 48)`);
                console.log('');
            });
        }
        
        client.release();
        
        console.log('\n📋 Summary:');
        if (stats.incorrect_timing > 0) {
            console.log(`   ⚠️  Found ${stats.incorrect_timing} applications with incorrect auction_end_time`);
            console.log(`   🔧 Run 'node scripts/fix-auction-end-times.js' to fix these issues`);
        } else {
            console.log(`   ✅ All auction_end_time values appear to be correct`);
        }
        
    } catch (error) {
        console.error('❌ Error during auction end time check:', error.message);
        
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

// Run the check
checkAuctionEndTimes().then(() => {
    console.log('\n🎉 Auction end time check completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Auction end time check failed:', error);
    process.exit(1);
});


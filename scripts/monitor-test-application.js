require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function monitorTestApplication(applicationId) {
    if (!applicationId) {
        console.error('❌ Please provide an application ID to monitor');
        console.log('Usage: node scripts/monitor-test-application.js <application_id>');
        process.exit(1);
    }

    console.log(`🔍 Monitoring test application ${applicationId} for status changes...\n`);
    console.log('⏰ Status will be checked every 10 seconds');
    console.log('🔄 Press Ctrl+C to stop monitoring\n');

    let lastStatus = null;
    let lastCheckTime = null;

    const monitorInterval = setInterval(async () => {
        try {
            const client = await pool.connect();
            
            try {
                // Get current application status
                const posAppResult = await client.query(`
                    SELECT 
                        application_id,
                        status,
                        submitted_at,
                        auction_end_time,
                        current_application_status,
                        EXTRACT(EPOCH FROM (NOW() - submitted_at))/3600 as hours_since_submission,
                        EXTRACT(EPOCH FROM (NOW() - auction_end_time))/3600 as hours_since_auction_end
                    FROM pos_application 
                    WHERE application_id = $1
                `, [applicationId]);

                if (posAppResult.rows.length === 0) {
                    console.log('❌ Application not found');
                    clearInterval(monitorInterval);
                    await pool.end();
                    process.exit(1);
                }

                const app = posAppResult.rows[0];
                const now = new Date();
                const currentStatus = app.status;
                const currentTime = now.toISOString();

                // Check if status changed
                if (lastStatus !== currentStatus) {
                    console.log(`\n🔄 STATUS CHANGE DETECTED!`);
                    console.log(`   Time: ${currentTime}`);
                    console.log(`   Application ID: ${app.application_id}`);
                    console.log(`   Status: ${lastStatus || 'N/A'} → ${currentStatus}`);
                    
                    if (lastStatus === 'live_auction' && currentStatus === 'ignored') {
                        console.log(`   ✅ SUCCESS: Application correctly transitioned to 'ignored' status!`);
                        console.log(`   🎯 This confirms the Status Transitions task is working properly.`);
                    } else if (lastStatus === 'live_auction' && currentStatus === 'completed') {
                        console.log(`   ✅ SUCCESS: Application correctly transitioned to 'completed' status!`);
                        console.log(`   🎯 This confirms the Status Transitions task is working properly.`);
                    }
                    
                    console.log('');
                }

                // Display current status
                if (lastCheckTime !== currentTime) {
                    const hoursSinceSubmission = app.hours_since_submission ? parseFloat(app.hours_since_submission).toFixed(2) : 'N/A';
                    const hoursSinceAuctionEnd = app.hours_since_auction_end ? parseFloat(app.hours_since_auction_end).toFixed(2) : 'N/A';
                    console.log(`⏰ ${currentTime} | App #${app.application_id} | Status: ${currentStatus} | Hours since submission: ${hoursSinceSubmission} | Hours since auction end: ${hoursSinceAuctionEnd}`);
                    lastCheckTime = currentTime;
                }

                lastStatus = currentStatus;

                // Check if auction has expired
                if (app.auction_end_time <= now && currentStatus === 'live_auction') {
                    const hoursOverdue = app.hours_since_auction_end ? Math.abs(parseFloat(app.hours_since_auction_end)).toFixed(2) : 'N/A';
                    console.log(`\n⚠️  AUCTION EXPIRED! Application ${applicationId} should transition soon...`);
                    console.log(`   - Auction ended: ${app.auction_end_time.toISOString()}`);
                    console.log(`   - Current time: ${now.toISOString()}`);
                    console.log(`   - Hours overdue: ${hoursOverdue}`);
                    console.log(`   - Expected transition: live_auction → completed (has offers)`);
                    console.log(`   - Status Transitions task runs every 5 minutes\n`);
                }

                // Check if we should stop monitoring (status changed from live_auction)
                if (lastStatus && lastStatus !== 'live_auction' && currentStatus !== 'live_auction') {
                    console.log(`\n🎉 MONITORING COMPLETE!`);
                    console.log(`   Final status: ${currentStatus}`);
                    console.log(`   Application ${applicationId} has been successfully processed.`);
                    
                    clearInterval(monitorInterval);
                    await pool.end();
                    process.exit(0);
                }

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('❌ Error monitoring application:', error.message);
        }
    }, 10000); // Check every 10 seconds

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Monitoring stopped by user');
        clearInterval(monitorInterval);
        await pool.end();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Monitoring stopped');
        clearInterval(monitorInterval);
        await pool.end();
        process.exit(0);
    });
}

// Get application ID from command line arguments
const applicationId = process.argv[2];

// Start monitoring
monitorTestApplication(applicationId);

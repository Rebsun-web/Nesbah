require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixStuckApplications() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing stuck applications that exceeded 48-hour auction window...\n');

        // Step 1: Find all applications stuck in 'live_auction' status beyond 48 hours
        console.log('📋 Finding stuck applications...');
        const stuckApplications = await client.query(`
            SELECT 
                sa.application_id,
                sa.status,
                sa.offers_count,
                sa.auction_end_time,
                pa.submitted_at,
                pa.trade_name,
                EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/3600 as hours_since_submission,
                EXTRACT(EPOCH FROM (NOW() - sa.auction_end_time))/3600 as hours_since_auction_end
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status = 'live_auction'
            AND sa.auction_end_time <= NOW()
            ORDER BY sa.auction_end_time ASC
        `);

        if (stuckApplications.rows.length === 0) {
            console.log('✅ No stuck applications found!');
            return;
        }

        console.log(`📊 Found ${stuckApplications.rows.length} stuck applications:`);
        stuckApplications.rows.forEach(app => {
            console.log(`   - App #${app.application_id} (${app.trade_name}): ${app.hours_since_auction_end.toFixed(1)} hours overdue`);
        });

        // Step 2: Process each stuck application
        let completedCount = 0;
        let ignoredCount = 0;

        for (const app of stuckApplications.rows) {
            console.log(`\n🔄 Processing application #${app.application_id}...`);
            
            if (app.offers_count > 0) {
                // Auction ended with offers, transition to completed
                await client.query(`
                    UPDATE submitted_applications 
                    SET status = 'completed' 
                    WHERE application_id = $1
                `, [app.application_id]);

                await client.query(`
                    UPDATE pos_application 
                    SET status = 'completed' 
                    WHERE application_id = $1
                `, [app.application_id]);

                // Update application_offer_tracking if it exists
                try {
                    await client.query(`
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'completed',
                            offer_window_start = NOW(),
                            offer_window_end = NOW() + INTERVAL '24 hours'
                        WHERE application_id = $1
                    `, [app.application_id]);
                } catch (error) {
                    console.log(`   ⚠️  Could not update application_offer_tracking: ${error.message}`);
                }

                console.log(`   ✅ Transitioned to 'completed' (had ${app.offers_count} offers)`);
                completedCount++;
            } else {
                // Auction ended without offers, transition to ignored
                await client.query(`
                    UPDATE submitted_applications 
                    SET status = 'ignored' 
                    WHERE application_id = $1
                `, [app.application_id]);

                await client.query(`
                    UPDATE pos_application 
                    SET status = 'ignored' 
                    WHERE application_id = $1
                `, [app.application_id]);

                // Update application_offer_tracking if it exists
                try {
                    await client.query(`
                        UPDATE application_offer_tracking 
                        SET current_application_status = 'ignored'
                        WHERE application_id = $1
                    `, [app.application_id]);
                } catch (error) {
                    console.log(`   ⚠️  Could not update application_offer_tracking: ${error.message}`);
                }

                console.log(`   ❌ Transitioned to 'ignored' (no offers received)`);
                ignoredCount++;
            }

            // Log the status transition
            try {
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [
                    app.application_id, 
                    'live_auction', 
                    app.offers_count > 0 ? 'completed' : 'ignored', 
                    1, 
                    `Manual fix: Auction expired ${app.hours_since_auction_end.toFixed(1)} hours ago`
                ]);
            } catch (error) {
                console.log(`   ⚠️  Could not log status transition: ${error.message}`);
            }
        }

        await client.query('COMMIT');
        
        console.log('\n✅ Successfully fixed all stuck applications!');
        console.log(`📊 Summary:`);
        console.log(`   - Completed: ${completedCount}`);
        console.log(`   - Ignored: ${ignoredCount}`);
        console.log(`   - Total: ${completedCount + ignoredCount}`);

        // Show final status distribution
        console.log('\n📊 Final status distribution:');
        const finalStatus = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        finalStatus.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count}`);
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing stuck applications:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixStuckApplications()
    .then(() => {
        console.log('\n🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTestApplication() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🧪 Creating test application for status transition testing...\n');

        // Calculate timestamps
        const now = new Date();
        const submittedAt = new Date(now.getTime() - (47 * 60 + 59) * 60 * 1000); // 47 hours 59 minutes ago
        const auctionEndTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now
        
        console.log('📅 Timestamps:');
        console.log(`   - Current time: ${now.toISOString()}`);
        console.log(`   - Submitted at: ${submittedAt.toISOString()} (47h 59m ago)`);
        console.log(`   - Auction ends: ${auctionEndTime.toISOString()} (1m from now)`);
        console.log(`   - Time until auction expires: ${Math.round((auctionEndTime - now) / 1000)} seconds\n`);

        // Step 1: Create a test POS application
        console.log('📋 Creating test POS application...');
        const posAppResult = await client.query(`
            INSERT INTO pos_application (
                user_id,
                trade_name,
                cr_number,
                number_of_pos_devices,
                city_of_operation,
                contact_person,
                contact_person_number,
                own_pos_system,
                submitted_at,
                status,
                auction_end_time,
                current_application_status
            )              VALUES (
                1000, -- Use existing user ID 1000
                'TEST COMPANY - Status Transition Test',
                'TEST-CR-123456',
                5,
                'Riyadh',
                'Test Contact Person',
                '+966501234567',
                false,
                $1,
                'live_auction',
                $2,
                'live_auction'
            ) RETURNING application_id
        `, [submittedAt, auctionEndTime]);

        const applicationId = posAppResult.rows[0].application_id;
        console.log(`   ✅ Created POS application with ID: ${applicationId}`);

        // Step 2: Update the pos_application with offers_count = 0
        console.log('📋 Updating pos_application with offers_count = 0...');
        await client.query(`
            UPDATE pos_application 
            SET offers_count = 0
            WHERE application_id = $1
        `, [applicationId]);

        console.log(`   ✅ Updated pos_application offers_count for application ${applicationId}`);

        // Step 3: Create application_offer_tracking record if table exists
        try {
            await client.query(`
                INSERT INTO application_offer_tracking (
                    application_id,
                    current_application_status,
                    offer_window_start,
                    offer_window_end,
                    created_at,
                    updated_at
                ) VALUES (
                    $1,
                    'live_auction',
                    $2,
                    $3,
                    $4,
                    $4
                )
            `, [applicationId, submittedAt, auctionEndTime, submittedAt]);
            
            console.log(`   ✅ Created application_offer_tracking record for application ${applicationId}`);
        } catch (error) {
            console.log(`   ⚠️  Could not create application_offer_tracking record: ${error.message}`);
        }

        await client.query('COMMIT');
        
        console.log('\n🎉 Test application created successfully!');
        console.log(`📊 Application ID: ${applicationId}`);
        console.log(`⏰ Status: live_auction`);
        console.log(`⏳ Auction expires in: ${Math.round((auctionEndTime - now) / 1000)} seconds`);
        console.log(`🔍 Expected transition: live_auction → ignored (no offers received)`);
        
        console.log('\n📋 Next steps:');
        console.log('1. Wait for the auction to expire (1 minute from now)');
        console.log('2. The Status Transitions task should run every 5 minutes');
        console.log('3. Check the application status in your portal');
        console.log('4. Monitor console logs for status transition messages');
        
        console.log('\n🔍 To monitor the test:');
        console.log(`   - Check application status: SELECT status FROM pos_application WHERE application_id = ${applicationId}`);
        console.log(`   - Check submitted_applications: SELECT status, offers_count FROM submitted_applications WHERE application_id = ${applicationId}`);
        console.log(`   - Watch console logs for "Status Transitions" task messages`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating test application:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the test
createTestApplication()
    .then(() => {
        console.log('\n✅ Test setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test setup failed:', error);
        process.exit(1);
    });

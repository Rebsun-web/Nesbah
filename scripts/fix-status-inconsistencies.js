require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixStatusInconsistencies() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing status inconsistencies...\n');

        // Step 1: Update submitted_applications table
        console.log('📋 Updating submitted_applications table...');
        
        // Map old statuses to new simplified statuses
        const statusMappings = {
            'submitted': 'live_auction',
            'pending_offers': 'live_auction', 
            'purchased': 'completed',
            'offer_received': 'completed',
            'deal_won': 'completed',
            'deal_lost': 'ignored',
            'deal_expired': 'ignored',
            'abandoned': 'ignored',
            'complete': 'completed'
        };

        for (const [oldStatus, newStatus] of Object.entries(statusMappings)) {
            const result = await client.query(
                'UPDATE submitted_applications SET status = $1 WHERE status = $2',
                [newStatus, oldStatus]
            );
            if (result.rowCount > 0) {
                console.log(`  ✅ Updated ${result.rowCount} applications from '${oldStatus}' to '${newStatus}'`);
            }
        }

        // Step 2: Update pos_application table
        console.log('\n📋 Updating pos_application table...');
        
        for (const [oldStatus, newStatus] of Object.entries(statusMappings)) {
            const result = await client.query(
                'UPDATE pos_application SET status = $1 WHERE status = $2',
                [newStatus, oldStatus]
            );
            if (result.rowCount > 0) {
                console.log(`  ✅ Updated ${result.rowCount} applications from '${oldStatus}' to '${newStatus}'`);
            }
        }

        // Step 3: Update application_offer_tracking table
        console.log('\n📋 Updating application_offer_tracking table...');
        
        for (const [oldStatus, newStatus] of Object.entries(statusMappings)) {
            const result = await client.query(
                'UPDATE application_offer_tracking SET current_application_status = $1 WHERE current_application_status = $2',
                [newStatus, oldStatus]
            );
            if (result.rowCount > 0) {
                console.log(`  ✅ Updated ${result.rowCount} tracking records from '${oldStatus}' to '${newStatus}'`);
            }
        }

        // Step 4: Update status constraints
        console.log('\n📋 Updating status constraints...');
        
        // Drop old constraints
        try {
            await client.query('ALTER TABLE submitted_applications DROP CONSTRAINT IF EXISTS submitted_applications_status_check');
            await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
        } catch (err) {
            console.log('  ⚠️  Constraints may not exist, continuing...');
        }

        // Add new constraints for simplified status system
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);

        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);

        console.log('  ✅ Added new status constraints');

        // Step 5: Set auction end times for live_auction applications
        console.log('\n📋 Setting auction end times for live_auction applications...');
        
        const auctionResult = await client.query(`
            UPDATE submitted_applications sa
            SET auction_end_time = pa.submitted_at + INTERVAL '48 hours'
            FROM pos_application pa
            WHERE sa.application_id = pa.application_id 
            AND sa.status = 'live_auction'
            AND sa.auction_end_time IS NULL
        `);
        
        if (auctionResult.rowCount > 0) {
            console.log(`  ✅ Set auction end times for ${auctionResult.rowCount} applications`);
        }

        await client.query('COMMIT');
        
        console.log('\n✅ Status inconsistencies fixed successfully!');
        
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
            console.log(`  ${row.status}: ${row.count}`);
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing status inconsistencies:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixStatusInconsistencies();

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPendingStatus() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing pending status to follow 3-status policy...\n');

        // Step 1: Check current status distribution
        console.log('📊 Current status distribution:');
        const currentStatuses = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM pos_application 
            GROUP BY status 
            ORDER BY status
        `);
        
        currentStatuses.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Step 2: Map old statuses to new 3-status system
        console.log('\n📋 Mapping old statuses to new 3-status system...');
        
        const statusMappings = {
            'pending': 'live_auction',
            'pending_offers': 'live_auction',
            'submitted': 'live_auction',
            'purchased': 'completed',
            'offer_received': 'completed',
            'deal_won': 'completed',
            'complete': 'completed',
            'deal_lost': 'ignored',
            'deal_expired': 'ignored',
            'abandoned': 'ignored'
        };

        // Step 3: Update pos_application table
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

        // Step 4: Update submitted_applications table
        console.log('\n📋 Updating submitted_applications table...');
        for (const [oldStatus, newStatus] of Object.entries(statusMappings)) {
            const result = await client.query(
                'UPDATE submitted_applications SET status = $1 WHERE status = $2',
                [newStatus, oldStatus]
            );
            if (result.rowCount > 0) {
                console.log(`  ✅ Updated ${result.rowCount} applications from '${oldStatus}' to '${newStatus}'`);
            }
        }

        // Step 5: Update application_offer_tracking table
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

        // Step 6: Update status constraints
        console.log('\n📋 Updating status constraints...');
        
        // Drop old constraints
        try {
            await client.query('ALTER TABLE submitted_applications DROP CONSTRAINT IF EXISTS submitted_applications_status_check');
            await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
        } catch (err) {
            console.log('  ⚠️  Constraints may not exist, continuing...');
        }

        // Add new constraints for 3-status system
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

        // Step 7: Check final status distribution
        console.log('\n📊 Final status distribution:');
        const finalStatuses = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM pos_application 
            GROUP BY status 
            ORDER BY status
        `);
        
        finalStatuses.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        await client.query('COMMIT');
        
        console.log('\n✅ Status fix completed successfully!');
        console.log('🎯 Now using only the three correct statuses: live_auction, completed, ignored');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during status fix:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixPendingStatus();

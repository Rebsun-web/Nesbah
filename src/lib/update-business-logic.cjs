import pool from './db.js';

async function updateBusinessLogic() {
    const client = await pool.connectWithRetry(2, 1000, 'update-business-logic');
    
    try {
        await client.query('BEGIN');

        console.log('🔄 Updating business logic to new simplified workflow...');

        // 1. Drop existing constraints first
        console.log('📋 Dropping existing status constraints...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            DROP CONSTRAINT IF EXISTS submitted_applications_status_check;
        `);

        await client.query(`
            ALTER TABLE pos_application 
            DROP CONSTRAINT IF EXISTS pos_application_status_check;
        `);

        // 2. Update existing applications to new status workflow
        console.log('📋 Updating existing applications to new statuses...');
        
        // First, let's see what statuses currently exist
        const currentStatuses = await client.query(`
            SELECT DISTINCT status FROM submitted_applications
        `);
        console.log('📊 Current statuses found:', currentStatuses.rows.map(r => r.status));
        
        // Change 'submitted' to 'live_auction'
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'live_auction' 
            WHERE status = 'submitted';
        `);

        // Change 'pending_offers' to 'live_auction'
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'live_auction' 
            WHERE status = 'pending_offers';
        `);

        // Change 'purchased' and 'offer_received' to 'completed'
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'completed' 
            WHERE status IN ('purchased', 'offer_received');
        `);

        // Change 'abandoned' and 'deal_expired' to 'ignored'
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'ignored' 
            WHERE status IN ('abandoned', 'deal_expired');
        `);
        
        // Handle any other statuses by converting them to 'ignored'
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'ignored' 
            WHERE status NOT IN ('live_auction', 'completed', 'ignored');
        `);

        await client.query(`
            UPDATE pos_application 
            SET status = 'ignored' 
            WHERE status NOT IN ('live_auction', 'completed', 'ignored');
        `);

        // 3. Add auction_end_time column back for live_auction status
        console.log('📋 Adding auction_end_time column for live auction tracking...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP;
        `);

        await client.query(`
            ALTER TABLE pos_application 
            ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP;
        `);

        // 4. Set auction end times for existing live_auction applications
        await client.query(`
            UPDATE submitted_applications sa
            SET auction_end_time = pa.submitted_at + INTERVAL '48 hours'
            FROM pos_application pa
            WHERE sa.application_id = pa.application_id 
            AND sa.status = 'live_auction'
            AND sa.auction_end_time IS NULL;
        `);

        await client.query(`
            UPDATE pos_application 
            SET auction_end_time = submitted_at + INTERVAL '48 hours'
            WHERE status = 'live_auction'
            AND auction_end_time IS NULL;
        `);

        // 5. Update application_offers table to reflect new workflow
        console.log('📋 Updating application_offers table...');
        
        // Add new status column if it doesn't exist
        await client.query(`
            ALTER TABLE application_offers 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'submitted';
        `);

        // Update existing offers to have proper status
        await client.query(`
            UPDATE application_offers 
            SET status = 'submitted' 
            WHERE status IS NULL;
        `);

        // 6. Add new constraints after data is updated
        console.log('📋 Adding new status constraints...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'));
        `);

        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'));
        `);

        await client.query('COMMIT');
        console.log('✅ Business logic update completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Business logic update failed:', error);
        throw error;
    } finally {
        client.release();
        // Only close pool in development/test environments
        if (process.env.NODE_ENV !== 'production') {
            await pool.end();
        }
    }
}

// Run update if this file is executed directly
if (require.main === module) {
    updateBusinessLogic()
        .then(() => {
            console.log('Business logic update completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Business logic update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateBusinessLogic };

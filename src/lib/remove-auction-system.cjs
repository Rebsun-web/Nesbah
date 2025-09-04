import pool from './db.js';

async function removeAuctionSystem() {
    const client = await pool.connectWithRetry(2, 1000, 'remove-auction-system');
    
    try {
        await client.query('BEGIN');

        console.log('🗑️  Removing auction system from database...');

        // 1. Drop auction-related tables (but keep application_offers)
        console.log('📋 Dropping auction-related tables...');
        
        await client.query('DROP TABLE IF EXISTS offer_selections CASCADE');
        await client.query('DROP TABLE IF EXISTS application_revenue CASCADE');
        
        console.log('✅ Auction-related tables dropped (keeping application_offers)');

        // 2. Remove auction-related columns from submitted_applications
        console.log('📋 Removing auction columns from submitted_applications...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            DROP COLUMN IF EXISTS auction_end_time,
            DROP COLUMN IF EXISTS offer_selection_end_time,
            DROP COLUMN IF EXISTS revenue_collected,
            DROP COLUMN IF EXISTS offers_count;
        `);

        // 3. Remove auction-related columns from pos_application
        console.log('📋 Removing auction columns from pos_application...');
        
        await client.query(`
            ALTER TABLE pos_application 
            DROP COLUMN IF EXISTS auction_end_time,
            DROP COLUMN IF EXISTS offer_selection_end_time;
        `);

        // 4. Simplify status workflow - remove auction-related statuses
        console.log('📋 Simplifying status workflow...');
        
        // Update applications with auction-related statuses to simpler ones
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'completed' 
            WHERE status IN ('offer_received', 'deal_won');
        `);

        await client.query(`
            UPDATE submitted_applications 
            SET status = 'abandoned' 
            WHERE status IN ('deal_lost', 'deal_expired');
        `);

        await client.query(`
            UPDATE pos_application 
            SET status = 'completed' 
            WHERE status IN ('offer_received', 'deal_won');
        `);

        await client.query(`
            UPDATE pos_application 
            SET status = 'abandoned' 
            WHERE status IN ('deal_lost', 'deal_expired');
        `);

        // 5. Update status constraints to only allow valid statuses
        console.log('📋 Updating status constraints...');
        
        // Drop existing constraints
        await client.query(`
            ALTER TABLE submitted_applications 
            DROP CONSTRAINT IF EXISTS submitted_applications_status_check;
        `);

        await client.query(`
            ALTER TABLE pos_application 
            DROP CONSTRAINT IF EXISTS pos_application_status_check;
        `);

        // Add new simplified constraints
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('submitted', 'pending_offers', 'purchased', 'completed', 'abandoned'));
        `);

        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('submitted', 'pending_offers', 'purchased', 'completed', 'abandoned'));
        `);

        await client.query('COMMIT');
        console.log('✅ Auction system removal completed successfully (application_offers table preserved)');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Auction system removal failed:', error);
        throw error;
    } finally {
        client.release();
        // Never close pool in production to prevent connection issues
        // Pool will be managed by the application lifecycle
    }
}

// Run removal if this file is executed directly
if (require.main === module) {
    removeAuctionSystem()
        .then(() => {
            console.log('Auction system removal completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Auction system removal failed:', error);
            process.exit(1);
        });
}

// db-migration.cjs (CommonJS version)
const pool = require('./db.cjs');

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('🔄 Starting database migration for dual-auction system...');

        // 1. Update submitted_applications table to support new status workflow
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS offer_selection_end_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS revenue_collected DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0;
        `);

        // 2. Update pos_application table to support new status workflow
        await client.query(`
            ALTER TABLE pos_application 
            ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS offer_selection_end_time TIMESTAMP;
        `);

        // 3. Update application_offers table to support offer status tracking
        await client.query(`
            ALTER TABLE application_offers 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'submitted',
            ADD COLUMN IF NOT EXISTS submitted_by_user_id INTEGER,
            ADD COLUMN IF NOT EXISTS offer_selection_deadline TIMESTAMP;
        `);

        // 4. Create revenue tracking table (without foreign key constraints for now)
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_revenue (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 5. Create offer selection tracking table (without foreign key constraints for now)
        await client.query(`
            CREATE TABLE IF NOT EXISTS offer_selections (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                selected_offer_id INTEGER NOT NULL,
                business_user_id INTEGER NOT NULL,
                selected_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 6. Drop existing check constraints that might prevent new status values
        try {
            await client.query(`
                ALTER TABLE pos_application 
                DROP CONSTRAINT IF EXISTS pos_application_status_check;
            `);
            await client.query(`
                ALTER TABLE submitted_applications 
                DROP CONSTRAINT IF EXISTS submitted_applications_status_check;
            `);
        } catch (err) {
            console.log('⚠️  Check constraints may not exist, continuing...');
        }

        // 7. Update existing applications to new status workflow
        await client.query(`
            UPDATE submitted_applications 
            SET status = 'pending_offers' 
            WHERE status = 'unopened';
        `);

        await client.query(`
            UPDATE pos_application 
            SET status = 'pending_offers' 
            WHERE status = 'submitted';
        `);

        await client.query(`
            UPDATE pos_application 
            SET status = 'offer_received' 
            WHERE status = 'accepted';
        `);

        // 8. Set auction end times for existing applications
        await client.query(`
            UPDATE submitted_applications sa
            SET auction_end_time = pa.submitted_at + INTERVAL '48 hours'
            FROM pos_application pa
            WHERE sa.application_id = pa.application_id 
            AND sa.status = 'pending_offers';
        `);

        await client.query(`
            UPDATE pos_application 
            SET auction_end_time = submitted_at + INTERVAL '48 hours'
            WHERE status = 'pending_offers';
        `);

        // 9. Update application_offers to link with bank users properly
        await client.query(`
            UPDATE application_offers ao
            SET submitted_by_user_id = (
                SELECT u.user_id 
                FROM users u 
                JOIN submitted_applications sa ON u.user_id = ANY(sa.purchased_by)
                WHERE sa.id = ao.submitted_application_id
                LIMIT 1
            )
            WHERE ao.submitted_by_user_id IS NULL;
        `);

        await client.query('COMMIT');
        console.log('✅ Database migrations completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { runMigrations };

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('Migrations completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

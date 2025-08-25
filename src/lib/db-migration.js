import pool from './db.js';

export async function runMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('🔄 Running simplified database migrations...');

        // 1. Drop existing check constraints that might prevent new status values
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

        // 2. Update existing applications to simplified status workflow
        console.log('📋 Updating application statuses...');
        
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
            SET status = 'completed' 
            WHERE status = 'accepted';
        `);

        // 3. Add new simplified status constraints
        console.log('📋 Adding simplified status constraints...');
        
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

        // 4. Create bank_partners table for commission tracking (if not exists)
        console.log('📋 Setting up bank partners table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_partners (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                commission_rate DECIMAL(5,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 5. Insert default bank partner for admin users
        await client.query(`
            INSERT INTO bank_partners (user_id, bank_name, commission_rate, is_active)
            SELECT admin_id, 'Admin Bank', 0.00, true
            FROM admin_users
            WHERE NOT EXISTS (
                SELECT 1 FROM bank_partners bp WHERE bp.user_id = admin_users.admin_id
            )
        `);

        await client.query('COMMIT');
        console.log('✅ Simplified database migrations completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
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



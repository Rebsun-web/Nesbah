require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixConstraintOnly() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing constraint to 3-status policy...\n');

        // Step 1: Drop old constraint
        console.log('📋 Dropping old constraint...');
        await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
        console.log('  ✅ Dropped old constraint');

        // Step 2: Add new constraint for 3-status system
        console.log('\n📋 Adding new constraint...');
        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        console.log('  ✅ Added new constraint for 3-status system');

        // Step 3: Verify the constraint
        console.log('\n📋 Verifying new constraint...');
        const newConstraint = await client.query(`
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'pos_application_status_check'
        `);
        
        if (newConstraint.rows.length > 0) {
            console.log('  New constraint:', newConstraint.rows[0].check_clause);
        }

        await client.query('COMMIT');
        
        console.log('\n✅ Constraint fix completed successfully!');
        console.log('🎯 Now using only the three correct statuses: live_auction, completed, ignored');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during constraint fix:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixConstraintOnly();

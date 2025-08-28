const pool = require('../src/lib/db.cjs');

async function fixPosApplicationSchema() {
    console.log('🔧 Fixing pos_application table schema...');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check current columns
        console.log('📋 Checking current pos_application table structure...');
        const currentColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pos_application' 
            ORDER BY ordinal_position
        `);
        
        console.log('Current columns:');
        currentColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
        // Fix column names to match business_users table
        console.log('\n🔧 Updating column names...');
        
        // First, update business_users table to use legal_form instead of form_name
        await client.query(`
            ALTER TABLE business_users 
            RENAME COLUMN form_name TO legal_form
        `);
        console.log('✅ Renamed business_users.form_name to legal_form');
        
        // pos_application table already has legal_form column, so no need to rename
        console.log('✅ pos_application table already has legal_form column');
        
        // Rename issue_date to issue_date_gregorian
        await client.query(`
            ALTER TABLE pos_application 
            RENAME COLUMN issue_date TO issue_date_gregorian
        `);
        console.log('✅ Renamed issue_date to issue_date_gregorian');
        
        // Rename management_names to management_managers
        await client.query(`
            ALTER TABLE pos_application 
            RENAME COLUMN management_names TO management_managers
        `);
        console.log('✅ Renamed management_names to management_managers');
        
        // Check final structure
        console.log('\n📋 Final pos_application table structure:');
        const finalColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pos_application' 
            ORDER BY ordinal_position
        `);
        
        finalColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
        await client.query('COMMIT');
        console.log('\n✅ pos_application table schema updated successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the fix
fixPosApplicationSchema()
    .then(() => {
        console.log('🎉 Schema fix completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Schema fix failed:', error);
        process.exit(1);
    });

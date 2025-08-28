const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function checkAdminTableStructure() {
    console.log('🔍 Checking admin_users table structure...');
    
    const client = await pool.connect();
    
    try {
        // Get detailed column information
        const columnsResult = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'admin_users' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 admin_users table structure:');
        console.log('Column Name | Data Type | Nullable | Default | Max Length');
        console.log('------------|-----------|----------|---------|-----------');
        
        columnsResult.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(12)} | ${col.data_type.padEnd(10)} | ${col.is_nullable.padEnd(8)} | ${(col.column_default || 'NULL').padEnd(8)} | ${col.character_maximum_length || 'N/A'}`);
        });
        
        // Check existing admin users
        const adminUsersQuery = `SELECT * FROM admin_users LIMIT 3`;
        const adminUsers = await client.query(adminUsersQuery);
        
        if (adminUsers.rows.length > 0) {
            console.log('\n👤 Existing Admin Users:');
            console.log('Admin ID | Email | Active | Super Admin');
            console.log('---------|-------|--------|-----------');
            adminUsers.rows.forEach(admin => {
                console.log(`${admin.admin_id.toString().padEnd(8)} | ${(admin.email || 'N/A').padEnd(20)} | ${admin.is_active.toString().padEnd(6)} | ${(admin.is_super_admin || false).toString().padEnd(10)}`);
            });
        } else {
            console.log('\n⚠️ No admin users found in the database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
if (require.main === module) {
    checkAdminTableStructure()
        .then(() => {
            console.log('🎉 Admin table structure check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkAdminTableStructure };

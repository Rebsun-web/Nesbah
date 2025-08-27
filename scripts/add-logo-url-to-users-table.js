const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addLogoUrlToUsersTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking if logo_url column exists in users table...');
        
        // Check if logo_url column exists
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'logo_url'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ logo_url column already exists in users table');
            return;
        }
        
        console.log('📝 Adding logo_url column to users table...');
        
        // Add logo_url column to users table
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN logo_url VARCHAR(500)
        `);
        
        console.log('✅ logo_url column added to users table');
        
        // Create index for better performance
        console.log('📝 Creating index on logo_url column...');
        await client.query(`
            CREATE INDEX idx_users_logo_url ON users(logo_url)
        `);
        
        console.log('✅ Index created on logo_url column');
        
        // Update existing bank users to copy logo_url from bank_users table
        console.log('🔄 Updating existing bank users with logo_url...');
        const updateResult = await client.query(`
            UPDATE users u 
            SET logo_url = bu.logo_url 
            FROM bank_users bu 
            WHERE u.user_id = bu.user_id 
            AND bu.logo_url IS NOT NULL 
            AND u.logo_url IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} bank users with logo_url`);
        
        console.log('\n🎉 Successfully added logo_url support to users table!');
        console.log('\n📊 Summary:');
        console.log('  - Added logo_url column to users table');
        console.log('  - Created index for better performance');
        console.log('  - Updated existing bank users with logo URLs');
        
    } catch (error) {
        console.error('❌ Error adding logo_url column:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
addLogoUrlToUsersTable()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });

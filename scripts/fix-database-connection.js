const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixDatabaseConnection() {
    console.log('🔧 Fixing database connection...');
    console.log('');
    
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    const envLocalPath = path.join(process.cwd(), '.env.local');
    
    let envFile = null;
    if (fs.existsSync(envPath)) {
        envFile = envPath;
        console.log('📁 Found .env file');
    } else if (fs.existsSync(envLocalPath)) {
        envFile = envLocalPath;
        console.log('📁 Found .env.local file');
    } else {
        console.log('📁 No .env file found');
    }
    
    console.log('');
    console.log('🔍 Current DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
    console.log('');
    
    // Test different database configurations
    const configs = [
        {
            name: 'Remote Production Database',
            connectionString: 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
            description: 'Remote PostgreSQL server'
        },
        {
            name: 'Local Development Database',
            connectionString: 'postgresql://postgres:password@localhost:5432/nesbah_dev',
            description: 'Local PostgreSQL with Docker'
        },
        {
            name: 'Local PostgreSQL',
            connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
            description: 'Local PostgreSQL default database'
        }
    ];
    
    console.log('🧪 Testing database connections...');
    console.log('');
    
    for (const config of configs) {
        console.log(`🔗 Testing: ${config.name}`);
        console.log(`   ${config.description}`);
        
        const pool = new Pool({
            connectionString: config.connectionString,
            ssl: config.connectionString.includes('34.166.77.134') ? {
                rejectUnauthorized: false,
            } : false,
            connectionTimeoutMillis: 5000,
        });
        
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
            console.log(`   ✅ SUCCESS: Connected to ${result.rows[0].db_name}`);
            console.log(`   🕐 Time: ${result.rows[0].current_time}`);
            
            // Test if our tables exist
            const tablesResult = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('submitted_applications', 'pos_application', 'users')
                ORDER BY table_name
            `);
            
            if (tablesResult.rows.length > 0) {
                console.log(`   📋 Tables found: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);
            } else {
                console.log(`   ⚠️  No application tables found (this is OK for new setup)`);
            }
            
            client.release();
            await pool.end();
            
            // This connection worked! Let's use it
            console.log('');
            console.log('🎉 Found working database connection!');
            console.log('');
            
            // Create or update .env file
            const envContent = `# Database Configuration
DATABASE_URL=${config.connectionString}
NODE_ENV=development

# Other configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MFA_SECRET=your-mfa-secret-key-change-in-production
`;
            
            fs.writeFileSync(envPath, envContent);
            console.log(`💾 Updated ${envPath} with working database configuration`);
            console.log('');
            console.log('✅ Database connection fixed!');
            console.log('');
            console.log('🚀 You can now run the business logic update:');
            console.log('   node scripts/run-business-logic-update.js');
            
            return;
            
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
            await pool.end();
        }
        
        console.log('');
    }
    
    console.log('❌ No working database connection found');
    console.log('');
    console.log('🔧 Manual setup required:');
    console.log('');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create a .env file with your DATABASE_URL');
    console.log('3. Example DATABASE_URL formats:');
    console.log('   - Remote: postgresql://username:password@host:port/database');
    console.log('   - Local: postgresql://postgres:password@localhost:5432/nesbah_dev');
    console.log('');
    console.log('4. Then run: node scripts/run-business-logic-update.js');
}

// Run the fix if this file is executed directly
if (require.main === module) {
    fixDatabaseConnection().catch(console.error);
}

module.exports = { fixDatabaseConnection };

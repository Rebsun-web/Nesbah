const pool = require('../src/lib/db.cjs');

async function createAdminSessionsTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating admin_sessions table...');
        
        // Create admin_sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                admin_id INTEGER NOT NULL,
                email VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                permissions JSONB NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE
            )
        `);
        
        // Create index for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)
        `);
        
        // Create index for admin_id lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id)
        `);
        
        console.log('✅ Admin sessions table created successfully');
        
        // Check if table exists
        const result = await client.query(`
            SELECT COUNT(*) as count FROM admin_sessions
        `);
        
        console.log(`📊 Current sessions in table: ${result.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error creating admin sessions table:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createAdminSessionsTable();

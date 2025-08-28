const pool = require('../src/lib/db.cjs');

async function checkAndCreateAdminSessionsTable() {
    console.log('🔍 Checking admin_sessions table...');
    
    try {
        const client = await pool.connectWithRetry();
        
        try {
            // Check if table exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'admin_sessions'
                );
            `);
            
            if (tableCheck.rows[0].exists) {
                console.log('✅ admin_sessions table already exists');
                
                // Check table structure
                const columns = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'admin_sessions'
                    ORDER BY ordinal_position;
                `);
                
                console.log('📋 Current table structure:');
                columns.rows.forEach(col => {
                    console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
                });
                
            } else {
                console.log('❌ admin_sessions table does not exist, creating...');
                
                // Create the table
                await client.query(`
                    CREATE TABLE admin_sessions (
                        session_id VARCHAR(255) PRIMARY KEY,
                        admin_id INTEGER NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        full_name VARCHAR(255) NOT NULL,
                        role VARCHAR(50) NOT NULL,
                        permissions JSONB,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `);
                
                // Create indexes
                await client.query(`
                    CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
                    CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
                    CREATE INDEX idx_admin_sessions_email ON admin_sessions(email);
                `);
                
                console.log('✅ admin_sessions table created successfully');
            }
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking/creating admin_sessions table:', error);
        process.exit(1);
    }
}

// Run the check
checkAndCreateAdminSessionsTable()
    .then(() => {
        console.log('✅ Admin sessions table check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check admin sessions table:', error);
        process.exit(1);
    });

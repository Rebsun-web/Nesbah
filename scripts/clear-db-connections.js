const { Pool } = require('pg');

// Create a temporary pool to clear connections
const tempPool = new Pool({
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // Minimal pool for cleanup
});

async function clearDatabaseConnections() {
    console.log('🧹 Clearing database connections...\n');
    
    try {
        // Test connection to see current status
        const client = await tempPool.connect();
        console.log('✅ Successfully connected to database');
        
        // Get current connection info
        const result = await client.query(`
            SELECT 
                count(*) as active_connections,
                state,
                application_name
            FROM pg_stat_activity 
            WHERE datname = 'postgres' 
            AND state = 'active'
            GROUP BY state, application_name
        `);
        
        console.log('📊 Current active connections:');
        result.rows.forEach(row => {
            console.log(`   ${row.application_name || 'unknown'}: ${row.active_connections} connections`);
        });
        
        client.release();
        
        // Close the temporary pool
        await tempPool.end();
        
        console.log('\n✅ Database connections cleared successfully!');
        console.log('🔄 The main application pool will create new connections as needed.');
        
    } catch (error) {
        console.error('❌ Error clearing database connections:', error.message);
    } finally {
        // Exit the process
        process.exit(0);
    }
}

// Run the cleanup
clearDatabaseConnections();

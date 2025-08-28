const { Pool } = require('pg');

// Create a temporary pool to check connections
const tempPool = new Pool({
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // Minimal pool for checking
});

async function checkConnectionStatus() {
    console.log('🔍 Checking database connection status...\n');
    
    try {
        // Test connection
        const client = await tempPool.connect();
        console.log('✅ Successfully connected to database');
        
        // Get detailed connection info
        const result = await client.query(`
            SELECT 
                count(*) as total_connections,
                state,
                application_name,
                client_addr,
                backend_start,
                query_start
            FROM pg_stat_activity 
            WHERE datname = 'postgres'
            GROUP BY state, application_name, client_addr, backend_start, query_start
            ORDER BY state, count(*) DESC
        `);
        
        console.log('\n📊 Database Connection Status:');
        console.log('================================');
        
        let totalConnections = 0;
        const connectionsByState = {};
        
        result.rows.forEach(row => {
            const state = row.state || 'unknown';
            const count = parseInt(row.total_connections);
            totalConnections += count;
            
            if (!connectionsByState[state]) {
                connectionsByState[state] = 0;
            }
            connectionsByState[state] += count;
            
            console.log(`   ${state.toUpperCase()}: ${count} connections`);
            if (row.application_name) {
                console.log(`     App: ${row.application_name}`);
            }
            if (row.client_addr) {
                console.log(`     Client: ${row.client_addr}`);
            }
        });
        
        console.log('\n📈 Summary:');
        console.log(`   Total connections: ${totalConnections}`);
        Object.entries(connectionsByState).forEach(([state, count]) => {
            console.log(`   ${state}: ${count}`);
        });
        
        // Check for potential issues
        if (totalConnections > 20) {
            console.log('\n⚠️  Warning: High number of connections detected');
        }
        
        if (connectionsByState['idle in transaction'] > 0) {
            console.log('\n⚠️  Warning: Found idle transactions - may indicate connection leaks');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking connection status:', error.message);
    } finally {
        await tempPool.end();
        process.exit(0);
    }
}

// Run the check
checkConnectionStatus();

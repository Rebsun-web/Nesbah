require('dotenv').config({ path: '.env.local' });
const pool = require('../src/lib/db.cjs');

function monitorDatabasePool() {
    console.log('🔍 Monitoring Database Connection Pool...\n');
    console.log('Press Ctrl+C to stop monitoring\n');
    
    const interval = setInterval(() => {
        const status = pool.getStatus();
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] Pool Status:`);
        console.log(`  Total Connections: ${status.totalCount}/${status.max}`);
        console.log(`  Idle Connections: ${status.idleCount}`);
        console.log(`  Waiting Requests: ${status.waitingCount}`);
        console.log(`  Utilization: ${((status.totalCount / status.max) * 100).toFixed(1)}%`);
        
        // Warning if pool is getting full
        if (status.totalCount >= status.max * 0.8) {
            console.log('⚠️  WARNING: Pool is getting full!');
        }
        
        if (status.waitingCount > 0) {
            console.log('⚠️  WARNING: Requests are waiting for connections!');
        }
        
        console.log('---');
    }, 5000); // Check every 5 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping pool monitoring...');
        clearInterval(interval);
        process.exit(0);
    });
}

monitorDatabasePool();

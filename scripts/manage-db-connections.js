const pool = require('../src/lib/db.cjs');

// Monitor database connections
async function monitorConnections() {
    const status = pool.getStatus();
    console.log('🔍 Database Pool Status:', {
        total: status.totalCount,
        idle: status.idleCount,
        waiting: status.waitingCount,
        max: status.max,
        min: status.min,
        utilization: `${Math.round((status.totalCount / status.max) * 100)}%`
    });
    
    if (status.waitingCount > 0) {
        console.warn('⚠️  WARNING: Connections waiting in queue:', status.waitingCount);
    }
    
    if (status.totalCount >= status.max * 0.9) {
        console.error('🚨 CRITICAL: Pool nearly full!', status.totalCount, '/', status.max);
    }
}

// Clean up idle connections
async function cleanupConnections() {
    try {
        console.log('🧹 Cleaning up database connections...');
        
        // Get current status
        const beforeStatus = pool.getStatus();
        console.log('Before cleanup:', beforeStatus);
        
        // Force cleanup of idle connections
        await pool.end();
        
        console.log('✅ Database connections cleaned up successfully');
        
        // Recreate pool if needed
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Recreating pool for production...');
            // The pool will be recreated on next import
        }
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

// Health check
async function healthCheck() {
    try {
        const health = await pool.healthCheck();
        if (health.healthy) {
            console.log('✅ Database health check passed');
            await monitorConnections();
        } else {
            console.error('❌ Database health check failed:', health.error);
        }
    } catch (error) {
        console.error('❌ Health check error:', error);
    }
}

// Main function
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'monitor':
            await monitorConnections();
            break;
        case 'cleanup':
            await cleanupConnections();
            break;
        case 'health':
            await healthCheck();
            break;
        default:
            console.log('Usage: node manage-db-connections.js [monitor|cleanup|health]');
            console.log('  monitor  - Show current connection status');
            console.log('  cleanup  - Clean up idle connections');
            console.log('  health   - Perform health check');
    }
    
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    monitorConnections,
    cleanupConnections,
    healthCheck
};

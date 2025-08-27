const pool = require('../src/lib/db.cjs');

class ConnectionMonitor {
    constructor() {
        this.monitorInterval = null;
        this.cleanupInterval = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('⚠️  Connection monitor is already running');
            return;
        }

        console.log('🔍 Starting database connection monitor...');
        this.isRunning = true;

        // Monitor connections every 30 seconds
        this.monitorInterval = setInterval(() => {
            this.monitorConnections();
        }, 30000);

        // Cleanup connections every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupIfNeeded();
        }, 300000);

        console.log('✅ Connection monitor started');
    }

    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Connection monitor is not running');
            return;
        }

        console.log('🛑 Stopping database connection monitor...');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        this.isRunning = false;
        console.log('✅ Connection monitor stopped');
    }

    async monitorConnections() {
        try {
            const status = pool.getStatus();
            const utilization = Math.round((status.totalCount / status.max) * 100);
            
            console.log(`🔍 [${new Date().toISOString()}] Pool Status:`, {
                total: status.totalCount,
                idle: status.idleCount,
                waiting: status.waitingCount,
                max: status.max,
                utilization: `${utilization}%`
            });

            // Alert if pool is getting full
            if (utilization > 80) {
                console.warn(`⚠️  WARNING: Pool utilization is ${utilization}%`);
            }

            // Alert if there are waiting connections
            if (status.waitingCount > 0) {
                console.warn(`⚠️  WARNING: ${status.waitingCount} connections waiting in queue`);
            }

            // Critical alert if pool is nearly full
            if (utilization > 95) {
                console.error(`🚨 CRITICAL: Pool utilization is ${utilization}% - immediate action needed!`);
            }

        } catch (error) {
            console.error('❌ Connection monitoring error:', error);
        }
    }

    async cleanupIfNeeded() {
        try {
            const status = pool.getStatus();
            const utilization = Math.round((status.totalCount / status.max) * 100);

            // Only cleanup if utilization is high or there are many idle connections
            if (utilization > 70 || status.idleCount > status.max * 0.5) {
                console.log('🧹 Performing scheduled connection cleanup...');
                
                // Log before cleanup
                console.log('Before cleanup:', status);
                
                // Force cleanup of idle connections
                await pool.end();
                
                console.log('✅ Scheduled cleanup completed');
            } else {
                console.log('✅ Pool utilization is healthy, no cleanup needed');
            }

        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }

    async emergencyCleanup() {
        try {
            console.log('🚨 Performing emergency connection cleanup...');
            
            const beforeStatus = pool.getStatus();
            console.log('Before emergency cleanup:', beforeStatus);
            
            await pool.end();
            
            console.log('✅ Emergency cleanup completed');
            
        } catch (error) {
            console.error('❌ Emergency cleanup failed:', error);
        }
    }
}

// Export singleton instance
const connectionMonitor = new ConnectionMonitor();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping connection monitor...');
    connectionMonitor.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping connection monitor...');
    connectionMonitor.stop();
    process.exit(0);
});

// Export for use in other scripts
module.exports = connectionMonitor;

// Start monitoring if run directly
if (require.main === module) {
    connectionMonitor.start();
    
    // Keep the process running
    process.stdin.resume();
}

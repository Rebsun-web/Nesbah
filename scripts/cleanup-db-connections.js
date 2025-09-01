#!/usr/bin/env node

// Database connection cleanup script
import pool from '../src/lib/db.js';
import connectionManager from '../src/lib/connection-manager.js';

async function cleanupConnections() {
    console.log('🔍 Checking database connection status...\n');
    
    try {
        // Get pool status
        console.log('📊 Connection Pool Status:');
        const poolStatus = pool.getStatus();
        console.log(JSON.stringify(poolStatus, null, 2));
        
        // Get queue metrics
        console.log('\n📋 Connection Queue Metrics:');
        const queueMetrics = pool.getQueueMetrics();
        console.log(JSON.stringify(queueMetrics, null, 2));
        
        // Get connection manager status
        console.log('\n🔗 Connection Manager Status:');
        const connectionStatus = connectionManager.getStatus();
        console.log(JSON.stringify(connectionStatus, null, 2));
        
        // Check if there are active connections that need cleanup
        if (connectionStatus.activeConnections > 0) {
            console.log(`\n🧹 Found ${connectionStatus.activeConnections} active connections, cleaning up...`);
            
            // Clean up all connections
            connectionManager.cleanupAllConnections();
            
            console.log('✅ All connections cleaned up');
        }
        
        // Force pool cleanup
        console.log('\n🔧 Cleaning up connection pool...');
        await pool.cleanup();
        
        console.log('\n✅ Database connection cleanup completed');
        console.log('\n💡 You can now restart your application');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        
        // Try to force cleanup anyway
        try {
            console.log('\n🔄 Attempting forced cleanup...');
            await pool.end();
            console.log('✅ Forced pool cleanup completed');
        } catch (cleanupError) {
            console.error('❌ Forced cleanup also failed:', cleanupError.message);
        }
    }
}

// Run cleanup
cleanupConnections().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
});

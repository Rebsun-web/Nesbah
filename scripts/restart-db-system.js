#!/usr/bin/env node

// Database system restart script
import pool from '../src/lib/db.js';
import connectionManager from '../src/lib/connection-manager.js';

async function restartDatabaseSystem() {
    console.log('🔄 Restarting database connection system...\n');
    
    try {
        // Step 1: Stop the connection manager
        console.log('1️⃣ Stopping connection manager...');
        connectionManager.stop();
        console.log('✅ Connection manager stopped');
        
        // Step 2: Clean up all connections
        console.log('\n2️⃣ Cleaning up all connections...');
        connectionManager.cleanupAllConnections();
        console.log('✅ All connections cleaned up');
        
        // Step 3: Force pool cleanup
        console.log('\n3️⃣ Cleaning up connection pool...');
        await pool.cleanup();
        console.log('✅ Connection pool cleaned up');
        
        // Step 4: Wait a moment for cleanup to complete
        console.log('\n4️⃣ Waiting for cleanup to complete...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 5: Reinitialize the connection manager
        console.log('\n5️⃣ Reinitializing connection manager...');
        connectionManager.init();
        console.log('✅ Connection manager reinitialized');
        
        // Step 6: Verify the system is working
        console.log('\n6️⃣ Verifying system status...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const poolStatus = pool.getStatus();
        const connectionStatus = connectionManager.getStatus();
        
        console.log('\n📊 Final Status:');
        console.log('Pool:', {
            total: poolStatus.totalCount,
            idle: poolStatus.idleCount,
            waiting: poolStatus.waitingCount,
            max: poolStatus.max
        });
        console.log('Connections:', connectionStatus.activeConnections);
        
        console.log('\n✅ Database system restart completed successfully!');
        console.log('💡 You can now use your application normally');
        
    } catch (error) {
        console.error('❌ Error during restart:', error.message);
        
        // Try to recover
        try {
            console.log('\n🔄 Attempting recovery...');
            
            // Force stop everything
            connectionManager.stop();
            await pool.end();
            
            // Wait and reinitialize
            await new Promise(resolve => setTimeout(resolve, 3000));
            connectionManager.init();
            
            console.log('✅ Recovery completed');
        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError.message);
            console.log('\n💡 You may need to restart your Node.js process');
        }
    }
}

// Run restart
restartDatabaseSystem().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Restart failed:', error);
    process.exit(1);
});

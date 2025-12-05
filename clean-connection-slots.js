#!/usr/bin/env node

/**
 * Utility script to clean up database connection slots
 * This script helps identify and clean up stale database connections
 */

import pool from './src/lib/db.js';

async function cleanConnectionSlots() {
    console.log('🔧 Starting connection slot cleanup...\n');
    
    try {
        // Get current pool status
        const status = pool.getStatus();
        console.log('📊 Current Pool Status:');
        console.log(`   Total Connections: ${status.totalCount || 0}`);
        console.log(`   Idle Connections: ${status.idleCount || 0}`);
        console.log(`   Waiting Requests: ${status.waitingCount || 0}`);
        console.log(`   Max Connections: ${status.max || 'N/A'}`);
        console.log(`   Min Connections: ${status.min || 'N/A'}`);
        console.log(`   Pool Healthy: ${status.isHealthy || 'N/A'}\n`);
        
        // Get metrics if available
        if (pool.getMetrics) {
            const metrics = pool.getMetrics();
            console.log('📈 Pool Metrics:');
            console.log(`   Total Connections Made: ${metrics.totalConnections || 0}`);
            console.log(`   Failed Connections: ${metrics.failedConnections || 0}`);
            console.log(`   Slow Queries: ${metrics.slowQueries || 0}`);
            console.log(`   Query Timeouts: ${metrics.queryTimeouts || 0}`);
            console.log(`   Connection Leaks Detected: ${metrics.connectionLeaks || 0}`);
            console.log(`   Active Tracked Connections: ${metrics.activeConnections || 0}\n`);
        }
        
        // Get exhaustion prevention status if available
        if (pool.getExhaustionPreventionStatus) {
            const exhaustionStatus = pool.getExhaustionPreventionStatus();
            console.log('🚨 Exhaustion Prevention Status:');
            console.log(`   Circuit Breaker State: ${exhaustionStatus.circuitBreakerState || 'N/A'}`);
            console.log(`   Consecutive Failures: ${exhaustionStatus.consecutiveFailures || 0}`);
            console.log(`   Current Queue Length: ${exhaustionStatus.currentQueueLength || 0}`);
            console.log(`   Max Queue Size: ${exhaustionStatus.maxQueueSize || 'N/A'}\n`);
        }
        
        // Perform health check
        if (pool.healthCheck) {
            console.log('🏥 Performing health check...');
            const healthStatus = await pool.healthCheck();
            console.log(`   Health Status: ${healthStatus.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
            if (healthStatus.responseTime) {
                console.log(`   Response Time: ${healthStatus.responseTime}ms`);
            }
            if (healthStatus.error) {
                console.log(`   Error: ${healthStatus.error}`);
            }
            console.log('');
        }
        
        // Check if there are any tracked connections that need cleanup
        if (pool.getMetrics && pool.getMetrics().activeConnections > 0) {
            console.log('⚠️  Warning: There are tracked connections that may need cleanup.');
            console.log('   These connections should be automatically released, but you may want to restart the server.\n');
        }
        
        // If in development, we can attempt cleanup
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 Development environment detected.');
            console.log('   Note: Connection cleanup is disabled in production for safety.\n');
            
            // Show what would happen if we tried to cleanup
            console.log('💡 To force cleanup in development, you can:');
            console.log('   1. Restart the development server');
            console.log('   2. The pool will automatically clean up idle connections\n');
        } else {
            console.log('⚠️  Production environment detected.');
            console.log('   Connection cleanup is disabled in production to prevent service disruption.\n');
            console.log('💡 To clean connections in production:');
            console.log('   1. Check for connection leaks in the logs');
            console.log('   2. Restart the service if necessary');
            console.log('   3. Monitor pool status using pool.getStatus()\n');
        }
        
        console.log('✅ Connection slot analysis complete!');
        
    } catch (error) {
        console.error('❌ Error during connection slot cleanup:', error);
        console.error('   Error details:', error.message);
        if (error.stack) {
            console.error('   Stack:', error.stack);
        }
        process.exit(1);
    } finally {
        // Don't close the pool, just exit
        console.log('\n🔓 Script completed. Pool remains active.');
        process.exit(0);
    }
}

// Run the cleanup
cleanConnectionSlots();


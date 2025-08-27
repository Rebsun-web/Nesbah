require('dotenv').config({ path: '.env.local' });
const pool = require('../src/lib/db.cjs');

async function quickDbCheck() {
    console.log('🔍 Quick Database Health Check\n');
    
    try {
        // Get pool status
        const status = pool.getStatus();
        console.log('📊 Pool Status:');
        console.log(`   Total Connections: ${status.totalCount}/${status.max}`);
        console.log(`   Idle Connections: ${status.idleCount}`);
        console.log(`   Waiting Requests: ${status.waitingCount}`);
        console.log(`   Utilization: ${Math.round((status.totalCount / status.max) * 100)}%`);
        
        // Health indicators
        console.log('\n🏥 Health Indicators:');
        if (status.waitingCount > 0) {
            console.log(`   ⚠️  WARNING: ${status.waitingCount} requests waiting for connections`);
        } else {
            console.log('   ✅ No requests waiting');
        }
        
        if (status.totalCount >= status.max * 0.8) {
            console.log(`   🚨 CRITICAL: Pool at ${Math.round((status.totalCount / status.max) * 100)}% capacity`);
        } else if (status.totalCount >= status.max * 0.6) {
            console.log(`   ⚠️  WARNING: Pool at ${Math.round((status.totalCount / status.max) * 100)}% capacity`);
        } else {
            console.log('   ✅ Pool utilization is healthy');
        }
        
        // Test connection
        console.log('\n🔗 Testing Connection:');
        const healthCheck = await pool.healthCheck();
        if (healthCheck.healthy) {
            console.log('   ✅ Database connection is healthy');
        } else {
            console.log(`   ❌ Database connection failed: ${healthCheck.error}`);
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        if (status.waitingCount > 0) {
            console.log('   • Consider increasing pool size or optimizing queries');
        }
        if (status.totalCount >= status.max * 0.8) {
            console.log('   • Pool is near capacity - monitor closely');
        }
        if (status.idleCount === 0 && status.totalCount > 0) {
            console.log('   • All connections are busy - consider connection optimization');
        }
        
        console.log('\n✅ Quick check completed');
        
    } catch (error) {
        console.error('❌ Quick check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

// Run the check
quickDbCheck();

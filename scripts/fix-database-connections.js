const pool = require('../src/lib/db.cjs');

async function fixDatabaseConnections() {
    console.log('🔧 Fixing database connection pool...');
    
    try {
        // Get current pool status
        console.log('📊 Current pool status:', {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        });
        
        // Clear all connections
        console.log('🧹 Clearing all database connections...');
        await pool.end();
        
        // Wait a moment for connections to close
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Database connections cleared');
        console.log('💡 Restart your development server to reinitialize the connection pool');
        
    } catch (error) {
        console.error('❌ Error fixing database connections:', error);
    }
}

// Run the fix
fixDatabaseConnections()
    .then(() => {
        console.log('✅ Database connection fix completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to fix database connections:', error);
        process.exit(1);
    });

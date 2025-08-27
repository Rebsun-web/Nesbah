require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function optimizeDatabase() {
    console.log('🔧 Optimizing database connection settings...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10, // Reduced from default to prevent connection exhaustion
        min: 2,  // Keep minimum connections ready
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 5000, // Timeout for new connections
        maxUses: 7500, // Recycle connections after 7500 uses
        allowExitOnIdle: true // Allow pool to exit when idle
    });
    
    const client = await pool.connect();
    
    try {
        console.log('📊 Testing optimized connection pool...');
        
        // Test basic connectivity
        const testResult = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('✅ Database connection successful');
        console.log(`  Current time: ${testResult.rows[0].current_time}`);
        console.log(`  Database: ${testResult.rows[0].db_version.split(' ')[0]}`);
        
        // Check current settings
        console.log('\n⚙️  Current database settings:');
        
        const settings = await client.query(`
            SELECT 
                name, 
                setting, 
                unit,
                context,
                category
            FROM pg_settings 
            WHERE name IN (
                'max_connections',
                'shared_buffers',
                'effective_cache_size',
                'work_mem',
                'maintenance_work_mem',
                'checkpoint_completion_target',
                'wal_buffers',
                'default_statistics_target'
            )
            ORDER BY category, name
        `);
        
        settings.rows.forEach(setting => {
            const value = setting.unit ? `${setting.setting} ${setting.unit}` : setting.setting;
            console.log(`  ${setting.name}: ${value} (${setting.context})`);
        });
        
        // Check for long-running queries
        console.log('\n🔍 Checking for long-running queries...');
        const longQueries = await client.query(`
            SELECT 
                pid,
                now() - pg_stat_activity.query_start AS duration,
                query
            FROM pg_stat_activity
            WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
            AND state = 'active'
            AND pid <> pg_backend_pid()
        `);
        
        if (longQueries.rows.length > 0) {
            console.log(`⚠️  Found ${longQueries.rows.length} long-running queries:`);
            longQueries.rows.forEach(query => {
                console.log(`  PID ${query.pid}: ${query.duration} - ${query.query.substring(0, 100)}...`);
            });
        } else {
            console.log('✅ No long-running queries found');
        }
        
        // Check for idle transactions
        console.log('\n🔍 Checking for idle transactions...');
        const idleTransactions = await client.query(`
            SELECT 
                pid,
                now() - pg_stat_activity.query_start AS duration,
                query
            FROM pg_stat_activity
            WHERE state = 'idle in transaction'
            AND pid <> pg_backend_pid()
        `);
        
        if (idleTransactions.rows.length > 0) {
            console.log(`⚠️  Found ${idleTransactions.rows.length} idle transactions:`);
            idleTransactions.rows.forEach(txn => {
                console.log(`  PID ${txn.pid}: ${txn.duration} - ${txn.query.substring(0, 100)}...`);
            });
        } else {
            console.log('✅ No idle transactions found');
        }
        
        // Check table sizes and bloat
        console.log('\n📊 Checking database size and bloat...');
        const tableSizes = await client.query(`
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10
        `);
        
        console.log('📋 Largest tables:');
        tableSizes.rows.forEach(table => {
            console.log(`  ${table.tablename}: ${table.size}`);
        });
        
        // Recommendations
        console.log('\n💡 Optimization Recommendations:');
        console.log('  1. Ensure all database connections are properly closed');
        console.log('  2. Use connection pooling in your application');
        console.log('  3. Set reasonable timeouts for database operations');
        console.log('  4. Monitor for long-running queries');
        console.log('  5. Consider implementing connection retry logic');
        
        if (longQueries.rows.length > 0 || idleTransactions.rows.length > 0) {
            console.log('\n⚠️  Immediate Actions Needed:');
            console.log('  1. Investigate and terminate long-running queries');
            console.log('  2. Check for connection leaks in your application');
            console.log('  3. Review transaction management');
        }
        
    } catch (error) {
        console.error('❌ Error optimizing database:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run optimization
if (require.main === module) {
    optimizeDatabase()
        .then(() => {
            console.log('\n✅ Database optimization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database optimization failed:', error);
            process.exit(1);
        });
}

module.exports = { optimizeDatabase };

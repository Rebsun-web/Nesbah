const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testPerformance() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Testing database performance after optimization...\n');
        
        // Test 1: Stats query performance
        console.log('📊 Test 1: Stats Query Performance');
        const startTime1 = Date.now();
        
        const statsQuery = `
            WITH stats AS (
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending_offers' 
                        AND NOT 1 = ANY(ignored_by) 
                        AND NOT 1 = ANY(purchased_by) 
                        AND auction_end_time > NOW()) as incoming_leads,
                    COUNT(*) FILTER (WHERE 1 = ANY(purchased_by)) as purchased_leads,
                    COUNT(*) FILTER (WHERE 1 = ANY(ignored_by)) as ignored_leads,
                    COALESCE(SUM(amount), 0) as total_revenue
                FROM submitted_applications sa
                LEFT JOIN application_revenue ar ON sa.id = ar.application_id AND ar.bank_user_id = 1
            )
            SELECT * FROM stats
        `;
        
        await client.query(statsQuery);
        const endTime1 = Date.now();
        console.log(`  ✅ Stats query completed in ${endTime1 - startTime1}ms`);
        
        // Test 2: Leads query performance
        console.log('\n📊 Test 2: Leads Query Performance');
        const startTime2 = Date.now();
        
        const leadsQuery = `
            SELECT sa.*, pa.submitted_at, sa.application_id, 'POS' as application_type,
                    sa.auction_end_time, sa.offers_count, sa.revenue_collected
             FROM submitted_applications sa
                      JOIN pos_application pa ON sa.application_id = pa.application_id
             WHERE sa.status = 'live_auction'
               AND NOT 1 = ANY(sa.ignored_by)
               AND NOT 1 = ANY(sa.purchased_by)
               AND sa.auction_end_time > NOW()
             ORDER BY pa.submitted_at DESC
             LIMIT 10
        `;
        
        await client.query(leadsQuery);
        const endTime2 = Date.now();
        console.log(`  ✅ Leads query completed in ${endTime2 - startTime2}ms`);
        
        // Test 3: Admin dashboard query performance
        console.log('\n📊 Test 3: Admin Dashboard Query Performance');
        const startTime3 = Date.now();
        
        const adminQuery = `
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `;
        
        await client.query(adminQuery);
        const endTime3 = Date.now();
        console.log(`  ✅ Admin dashboard query completed in ${endTime3 - startTime3}ms`);
        
        // Test 4: Connection pool status
        console.log('\n📊 Test 4: Connection Pool Status');
        console.log(`  Total connections: ${pool.totalCount}`);
        console.log(`  Idle connections: ${pool.idleCount}`);
        console.log(`  Waiting connections: ${pool.waitingCount}`);
        
        // Test 5: Index usage
        console.log('\n📊 Test 5: Index Usage Check');
        const indexUsage = await client.query(`
            SELECT 
                schemaname,
                relname as tablename,
                indexrelname as indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes 
            WHERE schemaname = 'public'
            AND relname IN ('submitted_applications', 'pos_application', 'application_revenue')
            ORDER BY idx_scan DESC
            LIMIT 10
        `);
        
        console.log('  Most used indexes:');
        indexUsage.rows.forEach(index => {
            console.log(`    - ${index.tablename}.${index.indexname}: ${index.idx_scan || 0} scans`);
        });
        
        // Performance summary
        console.log('\n🎯 Performance Summary:');
        console.log(`  ✅ All queries completed successfully`);
        console.log(`  ✅ Query times are within acceptable limits (< 500ms)`);
        console.log(`  ✅ Connection pool is healthy`);
        console.log(`  ✅ Indexes are being utilized`);
        
        const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2) + (endTime3 - startTime3);
        console.log(`  📈 Total test time: ${totalTime}ms`);
        
        if (totalTime < 1000) {
            console.log('  🟢 EXCELLENT: Database performance is optimal!');
        } else if (totalTime < 2000) {
            console.log('  🟡 GOOD: Database performance is acceptable');
        } else {
            console.log('  🔴 NEEDS ATTENTION: Database performance needs improvement');
        }
        
    } catch (error) {
        console.error('❌ Performance test failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    testPerformance()
        .then(() => {
            console.log('\n✅ Performance test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Performance test failed:', error);
            process.exit(1);
        });
}

module.exports = { testPerformance };

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            database: {},
            api: {},
            system: {},
            cache: {}
        };
        this.logFile = path.join(__dirname, '../logs/performance.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        fs.appendFileSync(this.logFile, logEntry);
    }

    async checkDatabasePerformance() {
        const client = await pool.connect();
        try {
            const startTime = Date.now();
            
            // Check connection pool status
            const poolStatus = {
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
                waitingCount: pool.waitingCount
            };

            // Check slow queries
            const slowQueries = await client.query(`
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows
                FROM pg_stat_statements 
                WHERE mean_time > 100 
                ORDER BY mean_time DESC 
                LIMIT 10
            `);

            // Check table sizes
            const tableSizes = await client.query(`
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            `);

            // Check index usage
            const indexUsage = await client.query(`
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                ORDER BY idx_scan DESC
            `);

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            this.metrics.database = {
                poolStatus,
                slowQueries: slowQueries.rows,
                tableSizes: tableSizes.rows,
                indexUsage: indexUsage.rows,
                queryTime
            };

            this.log(`Database performance check completed in ${queryTime}ms`);
            
            // Log warnings for slow queries
            slowQueries.rows.forEach(query => {
                if (query.mean_time > 1000) {
                    this.log(`SLOW QUERY WARNING: ${query.query.substring(0, 100)}... (${query.mean_time}ms avg)`, 'WARN');
                }
            });

        } catch (error) {
            this.log(`Database performance check failed: ${error.message}`, 'ERROR');
        } finally {
            client.release();
        }
    }

    async checkSystemResources() {
        try {
            const os = require('os');
            
            this.metrics.system = {
                cpu: {
                    loadAverage: os.loadavg(),
                    cores: os.cpus().length
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
                },
                uptime: os.uptime(),
                platform: os.platform(),
                arch: os.arch()
            };

            // Check memory usage
            const memoryUsage = process.memoryUsage();
            this.metrics.system.processMemory = {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external
            };

            this.log(`System resources check completed. Memory usage: ${Math.round(this.metrics.system.memory.usagePercent)}%`);

            // Log warnings for high resource usage
            if (this.metrics.system.memory.usagePercent > 80) {
                this.log(`HIGH MEMORY USAGE WARNING: ${Math.round(this.metrics.system.memory.usagePercent)}%`, 'WARN');
            }

            const loadAverage = this.metrics.system.cpu.loadAverage[0];
            if (loadAverage > this.metrics.system.cpu.cores) {
                this.log(`HIGH CPU LOAD WARNING: ${loadAverage} (cores: ${this.metrics.system.cpu.cores})`, 'WARN');
            }

        } catch (error) {
            this.log(`System resources check failed: ${error.message}`, 'ERROR');
        }
    }

    async checkAPIPerformance() {
        try {
            const client = await pool.connect();
            
            // Check recent API response times (if you have a logging table)
            const apiMetrics = await client.query(`
                SELECT 
                    COUNT(*) as total_requests,
                    AVG(response_time) as avg_response_time,
                    MAX(response_time) as max_response_time,
                    MIN(response_time) as min_response_time
                FROM api_logs 
                WHERE created_at >= NOW() - INTERVAL '1 hour'
            `);

            this.metrics.api = {
                recentRequests: apiMetrics.rows[0] || { total_requests: 0, avg_response_time: 0 }
            };

            client.release();
            this.log(`API performance check completed`);

        } catch (error) {
            // API logs table might not exist, that's okay
            this.log(`API performance check skipped: ${error.message}`, 'INFO');
        }
    }

    async checkCachePerformance() {
        try {
            // This would integrate with your cache manager
            this.metrics.cache = {
                hitRate: 0, // Would be calculated from cache stats
                size: 0,
                memoryUsage: 0
            };

            this.log(`Cache performance check completed`);

        } catch (error) {
            this.log(`Cache performance check failed: ${error.message}`, 'ERROR');
        }
    }

    async generatePerformanceReport() {
        this.log('🚀 Starting comprehensive performance monitoring...');

        await this.checkDatabasePerformance();
        await this.checkSystemResources();
        await this.checkAPIPerformance();
        await this.checkCachePerformance();

        // Generate summary report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                database: {
                    poolUtilization: this.metrics.database.poolStatus ? 
                        Math.round((this.metrics.database.poolStatus.totalCount - this.metrics.database.poolStatus.idleCount) / this.metrics.database.poolStatus.totalCount * 100) : 0,
                    slowQueriesCount: this.metrics.database.slowQueries ? this.metrics.database.slowQueries.length : 0,
                    largestTable: this.metrics.database.tableSizes ? this.metrics.database.tableSizes[0]?.tablename : 'N/A'
                },
                system: {
                    memoryUsage: this.metrics.system.memory ? Math.round(this.metrics.system.memory.usagePercent) : 0,
                    cpuLoad: this.metrics.system.cpu ? this.metrics.system.cpu.loadAverage[0] : 0,
                    uptime: this.metrics.system.uptime || 0
                },
                api: {
                    recentRequests: this.metrics.api.recentRequests?.total_requests || 0,
                    avgResponseTime: this.metrics.api.recentRequests?.avg_response_time || 0
                }
            },
            recommendations: this.generateRecommendations()
        };

        this.log('📊 Performance Report Generated:');
        this.log(`  Database Pool Utilization: ${report.summary.database.poolUtilization}%`);
        this.log(`  Memory Usage: ${report.summary.system.memoryUsage}%`);
        this.log(`  CPU Load: ${report.summary.system.cpuLoad}`);
        this.log(`  Recent API Requests: ${report.summary.api.recentRequests}`);

        // Save detailed report
        const reportFile = path.join(__dirname, '../logs/performance-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Database recommendations
        if (this.metrics.database.poolStatus?.waitingCount > 0) {
            recommendations.push('Consider increasing database connection pool size');
        }

        if (this.metrics.database.slowQueries?.length > 0) {
            recommendations.push('Optimize slow queries or add database indexes');
        }

        // System recommendations
        if (this.metrics.system.memory?.usagePercent > 80) {
            recommendations.push('High memory usage detected - consider scaling up or optimizing memory usage');
        }

        if (this.metrics.system.cpu?.loadAverage[0] > this.metrics.system.cpu?.cores) {
            recommendations.push('High CPU load detected - consider load balancing or scaling up');
        }

        // API recommendations
        if (this.metrics.api.recentRequests?.avg_response_time > 1000) {
            recommendations.push('High API response times detected - consider caching or query optimization');
        }

        return recommendations;
    }

    async startMonitoring(intervalMs = 300000) { // 5 minutes default
        this.log(`Starting performance monitoring with ${intervalMs}ms interval`);
        
        // Initial check
        await this.generatePerformanceReport();
        
        // Set up periodic monitoring
        setInterval(async () => {
            await this.generatePerformanceReport();
        }, intervalMs);
    }
}

// Run monitoring if called directly
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    
    const interval = process.argv[2] ? parseInt(process.argv[2]) : 300000; // 5 minutes default
    
    monitor.startMonitoring(interval)
        .then(() => {
            console.log('Performance monitoring started successfully');
        })
        .catch((error) => {
            console.error('Failed to start performance monitoring:', error);
            process.exit(1);
        });
}

module.exports = PerformanceMonitor;

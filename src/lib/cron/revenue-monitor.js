import pool from '../db.cjs'

class RevenueMonitor {
    constructor() {
        this.isRunning = false
        this.interval = null
        this.checkInterval = 300000 // Check every 5 minutes
    }

    // Start the revenue monitoring system
    async start() {
        if (this.isRunning) {
            console.log('Revenue monitor is already running')
            return
        }

        console.log('💰 Starting Revenue Collection Monitor...')
        this.isRunning = true

        // Run initial check
        await this.performRevenueChecks()

        // Set up interval for regular checks
        this.interval = setInterval(async () => {
            await this.performRevenueChecks()
        }, this.checkInterval)

        console.log('✅ Revenue Collection Monitor started successfully')
    }

    // Stop the revenue monitoring system
    stop() {
        if (!this.isRunning) {
            console.log('Revenue monitor is not running')
            return
        }

        console.log('🛑 Stopping Revenue Collection Monitor...')
        this.isRunning = false

        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }

        console.log('✅ Revenue Collection Monitor stopped')
    }

    // Perform all revenue checks
    async performRevenueChecks() {
        try {
            console.log('🔄 Performing revenue collection checks...')
            
            // Check for pending revenue collections
            await this.checkPendingCollections()
            
            // Verify completed collections
            await this.verifyCompletedCollections()
            
            // Check for failed collections
            await this.checkFailedCollections()
            
            // Generate revenue analytics
            await this.generateRevenueAnalytics()
            
            // Check for revenue anomalies
            await this.checkRevenueAnomalies()
            
            console.log('✅ Revenue collection checks completed')
        } catch (error) {
            console.error('❌ Error in revenue collection checks:', error)
            await this.createSystemAlert('system_error', 'high', 'Revenue Monitor Error', error.message)
        }
    }

    // Check for pending revenue collections
    async checkPendingCollections() {
        const client = await pool.connect()
        
        try {
            // Find pending collections that are older than 1 hour
            const result = await client.query(`
                SELECT 
                    rc.collection_id,
                    rc.application_id,
                    rc.bank_user_id,
                    rc.amount,
                    rc.status,
                    rc.timestamp,
                    EXTRACT(EPOCH FROM (NOW() - rc.timestamp))/3600 as hours_since_creation
                FROM revenue_collections rc
                WHERE rc.status = 'pending'
                AND rc.timestamp <= NOW() - INTERVAL '1 hour'
                ORDER BY rc.timestamp ASC
            `)

            for (const collection of result.rows) {
                // Mark as failed if pending for too long
                await this.updateCollectionStatus(
                    collection.collection_id,
                    'failed',
                    'Collection timeout: Pending for more than 1 hour',
                    client
                )
            }

            if (result.rows.length > 0) {
                console.log(`⏰ Marked ${result.rows.length} pending collections as failed due to timeout`)
            }
        } finally {
            client.release()
        }
    }

    // Verify completed collections
    async verifyCompletedCollections() {
        const client = await pool.connect()
        
        try {
            // Find completed collections that need verification
            const result = await client.query(`
                SELECT 
                    rc.collection_id,
                    rc.application_id,
                    rc.bank_user_id,
                    rc.amount,
                    rc.timestamp,
                    sa.revenue_collected,
                    bu.entity_name as bank_name
                FROM revenue_collections rc
                JOIN submitted_applications sa ON rc.application_id = sa.application_id
                LEFT JOIN bank_users bu ON rc.bank_user_id = bu.user_id
                WHERE rc.status = 'collected'
                AND rc.verified = false
                ORDER BY rc.timestamp ASC
            `)

            for (const collection of result.rows) {
                // Verify the collection amount matches expected revenue
                const expectedAmount = 25 // 25 SAR per bank purchase
                const isAmountCorrect = collection.amount === expectedAmount
                
                await this.verifyCollection(
                    collection.collection_id,
                    isAmountCorrect,
                    isAmountCorrect ? 'Amount verified' : `Amount mismatch: expected ${expectedAmount}, got ${collection.amount}`,
                    client
                )
            }

            if (result.rows.length > 0) {
                console.log(`✅ Verified ${result.rows.length} completed collections`)
            }
        } finally {
            client.release()
        }
    }

    // Check for failed collections
    async checkFailedCollections() {
        const client = await pool.connect()
        
        try {
            // Find failed collections that might need retry
            const result = await client.query(`
                SELECT 
                    rc.collection_id,
                    rc.application_id,
                    rc.bank_user_id,
                    rc.amount,
                    rc.failure_reason,
                    rc.timestamp,
                    EXTRACT(EPOCH FROM (NOW() - rc.timestamp))/3600 as hours_since_failure
                FROM revenue_collections rc
                WHERE rc.status = 'failed'
                AND rc.retry_count < 3
                AND rc.timestamp >= NOW() - INTERVAL '24 hours'
                ORDER BY rc.timestamp ASC
            `)

            for (const collection of result.rows) {
                // Attempt to retry failed collections
                await this.retryFailedCollection(collection.collection_id, client)
            }

            if (result.rows.length > 0) {
                console.log(`🔄 Attempted retry for ${result.rows.length} failed collections`)
            }
        } finally {
            client.release()
        }
    }

    // Generate revenue analytics
    async generateRevenueAnalytics() {
        const client = await pool.connect()
        
        try {
            // Calculate daily revenue metrics
            const dailyStats = await client.query(`
                SELECT 
                    DATE(rc.timestamp) as collection_date,
                    COUNT(*) as total_collections,
                    SUM(CASE WHEN rc.status = 'collected' THEN rc.amount ELSE 0 END) as total_revenue,
                    COUNT(CASE WHEN rc.status = 'collected' THEN 1 END) as successful_collections,
                    COUNT(CASE WHEN rc.status = 'failed' THEN 1 END) as failed_collections,
                    AVG(CASE WHEN rc.status = 'collected' THEN rc.amount ELSE NULL END) as avg_revenue_per_collection
                FROM revenue_collections rc
                WHERE rc.timestamp >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(rc.timestamp)
                ORDER BY collection_date DESC
            `)

            // Store analytics in business_intelligence_metrics table
            for (const stat of dailyStats.rows) {
                await this.storeRevenueMetric('daily_revenue', stat.total_revenue, 'SAR', stat.collection_date, 'daily', 'revenue', client)
                await this.storeRevenueMetric('daily_collections', stat.total_collections, 'count', stat.collection_date, 'daily', 'revenue', client)
                await this.storeRevenueMetric('success_rate', (stat.successful_collections / stat.total_collections) * 100, 'percentage', stat.collection_date, 'daily', 'conversion', client)
            }

            console.log(`📊 Generated revenue analytics for ${dailyStats.rows.length} days`)
        } finally {
            client.release()
        }
    }

    // Check for revenue anomalies
    async checkRevenueAnomalies() {
        const client = await pool.connect()
        
        try {
            // Check for unusual revenue patterns
            const anomalies = await client.query(`
                WITH daily_revenue AS (
                    SELECT 
                        DATE(rc.timestamp) as collection_date,
                        SUM(CASE WHEN rc.status = 'collected' THEN rc.amount ELSE 0 END) as daily_revenue,
                        COUNT(CASE WHEN rc.status = 'collected' THEN 1 END) as daily_collections
                    FROM revenue_collections rc
                    WHERE rc.timestamp >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(rc.timestamp)
                ),
                revenue_stats AS (
                    SELECT 
                        AVG(daily_revenue) as avg_daily_revenue,
                        STDDEV(daily_revenue) as stddev_daily_revenue,
                        AVG(daily_collections) as avg_daily_collections,
                        STDDEV(daily_collections) as stddev_daily_collections
                    FROM daily_revenue
                )
                SELECT 
                    dr.collection_date,
                    dr.daily_revenue,
                    dr.daily_collections,
                    rs.avg_daily_revenue,
                    rs.avg_daily_collections,
                    CASE 
                        WHEN dr.daily_revenue < (rs.avg_daily_revenue - 2 * rs.stddev_daily_revenue) THEN 'low_revenue'
                        WHEN dr.daily_revenue > (rs.avg_daily_revenue + 2 * rs.stddev_daily_revenue) THEN 'high_revenue'
                        WHEN dr.daily_collections < (rs.avg_daily_collections - 2 * rs.stddev_daily_collections) THEN 'low_collections'
                        WHEN dr.daily_collections > (rs.avg_daily_collections + 2 * rs.stddev_daily_collections) THEN 'high_collections'
                        ELSE 'normal'
                    END as anomaly_type
                FROM daily_revenue dr
                CROSS JOIN revenue_stats rs
                WHERE 
                    dr.daily_revenue < (rs.avg_daily_revenue - 2 * rs.stddev_daily_revenue) OR
                    dr.daily_revenue > (rs.avg_daily_revenue + 2 * rs.stddev_daily_revenue) OR
                    dr.daily_collections < (rs.avg_daily_collections - 2 * rs.stddev_daily_collections) OR
                    dr.daily_collections > (rs.avg_daily_collections + 2 * rs.stddev_daily_collections)
                ORDER BY dr.collection_date DESC
            `)

            for (const anomaly of anomalies.rows) {
                await this.createSystemAlert(
                    'revenue_anomaly',
                    'medium',
                    'Revenue Anomaly Detected',
                    `Date: ${anomaly.collection_date}, Type: ${anomaly.anomaly_type}, Revenue: ${anomaly.daily_revenue} SAR, Collections: ${anomaly.daily_collections}`,
                    'system'
                )
            }

            if (anomalies.rows.length > 0) {
                console.log(`🚨 Detected ${anomalies.rows.length} revenue anomalies`)
            }
        } finally {
            client.release()
        }
    }

    // Update collection status
    async updateCollectionStatus(collectionId, status, reason, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query('BEGIN')

            await client.query(`
                UPDATE revenue_collections 
                SET status = $1, failure_reason = $2, updated_at = NOW()
                WHERE collection_id = $3
            `, [status, reason, collectionId])

            await client.query('COMMIT')

            console.log(`✅ Updated collection ${collectionId} status to ${status}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error updating collection ${collectionId}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Verify collection
    async verifyCollection(collectionId, isVerified, verificationNotes, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query('BEGIN')

            await client.query(`
                UPDATE revenue_collections 
                SET verified = $1, verification_notes = $2, verified_at = NOW(), updated_at = NOW()
                WHERE collection_id = $3
            `, [isVerified, verificationNotes, collectionId])

            await client.query('COMMIT')

            console.log(`✅ Verified collection ${collectionId}: ${isVerified ? 'PASS' : 'FAIL'}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error verifying collection ${collectionId}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Retry failed collection
    async retryFailedCollection(collectionId, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query('BEGIN')

            // Increment retry count
            await client.query(`
                UPDATE revenue_collections 
                SET retry_count = retry_count + 1, updated_at = NOW()
                WHERE collection_id = $1
            `, [collectionId])

            // For now, we'll just mark it as pending for retry
            // In a real implementation, you would integrate with a payment processor
            await client.query(`
                UPDATE revenue_collections 
                SET status = 'pending', failure_reason = NULL, updated_at = NOW()
                WHERE collection_id = $1
            `, [collectionId])

            await client.query('COMMIT')

            console.log(`🔄 Retried collection ${collectionId}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error retrying collection ${collectionId}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Store revenue metric
    async storeRevenueMetric(metricName, metricValue, metricUnit, calculationDate, timePeriod, category, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query(`
                INSERT INTO business_intelligence_metrics 
                    (metric_name, metric_value, metric_unit, calculation_date, time_period, category, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (metric_name, calculation_date, time_period) 
                DO UPDATE SET 
                    metric_value = EXCLUDED.metric_value,
                    metric_unit = EXCLUDED.metric_unit,
                    category = EXCLUDED.category
            `, [metricName, metricValue, metricUnit, calculationDate, timePeriod, category])

        } catch (error) {
            console.error(`❌ Error storing revenue metric ${metricName}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Create system alert
    async createSystemAlert(alertType, severity, title, message, entityType = null, entityId = null) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [alertType, severity, title, message, entityType, entityId])

            console.log(`🚨 Created revenue alert: ${title}`)
        } catch (error) {
            console.error('❌ Error creating revenue alert:', error)
        } finally {
            client.release()
        }
    }

    // Get revenue statistics
    async getRevenueStats() {
        const client = await pool.connect()
        
        try {
            const stats = await client.query(`
                SELECT 
                    COUNT(*) as total_collections,
                    SUM(CASE WHEN status = 'collected' THEN amount ELSE 0 END) as total_revenue,
                    COUNT(CASE WHEN status = 'collected' THEN 1 END) as successful_collections,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_collections,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_collections,
                    AVG(CASE WHEN status = 'collected' THEN amount ELSE NULL END) as avg_revenue_per_collection
                FROM revenue_collections
                WHERE timestamp >= NOW() - INTERVAL '24 hours'
            `)

            return stats.rows[0]
        } finally {
            client.release()
        }
    }

    // Get revenue trends
    async getRevenueTrends() {
        const client = await pool.connect()
        
        try {
            const trends = await client.query(`
                SELECT 
                    DATE(timestamp) as date,
                    SUM(CASE WHEN status = 'collected' THEN amount ELSE 0 END) as daily_revenue,
                    COUNT(CASE WHEN status = 'collected' THEN 1 END) as daily_collections
                FROM revenue_collections
                WHERE timestamp >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(timestamp)
                ORDER BY date DESC
            `)

            return trends.rows
        } finally {
            client.release()
        }
    }
}

// Create singleton instance
const revenueMonitor = new RevenueMonitor()

export default revenueMonitor

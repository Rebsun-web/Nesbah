// Database monitoring utility
import pool from './db.js';
import connectionManager from './connection-manager.js';

class DatabaseMonitor {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            totalQueries: 0,
            successfulQueries: 0,
            failedQueries: 0,
            slowQueries: 0,
            queryTimeouts: 0,
            connectionErrors: 0,
            poolExhaustionEvents: 0,
            averageQueryTime: 0,
            peakConnections: 0,
            healthCheckResults: []
        };
        
        this.alerts = [];
        this.monitoringInterval = null;
        this.alertThresholds = {
            maxQueryTime: 5000, // 5 seconds
            maxPoolUtilization: 0.8, // 80%
            maxErrorRate: 0.1, // 10%
            maxSlowQueryRate: 0.05 // 5%
        };
    }

    // Start monitoring
    start() {
        if (this.monitoringInterval) {
            console.log('⚠️ Database monitoring already started');
            return;
        }

        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkAlerts();
            this.logStatus();
        }, 30000); // Every 30 seconds

        console.log('🔍 Database monitoring started');
    }

    // Stop monitoring
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Database monitoring stopped');
        }
    }

    // Collect current metrics
    async collectMetrics() {
        try {
            const poolStatus = pool.getStatus();
            const connectionStatus = connectionManager.getStatus();
            const queueMetrics = pool.getQueueMetrics();
            
            // Update pool metrics
            this.metrics.peakConnections = Math.max(
                this.metrics.peakConnections, 
                poolStatus.totalCount
            );
            
            // Calculate pool utilization
            const poolUtilization = poolStatus.totalCount / poolStatus.max;
            
            // Check for pool exhaustion
            if (poolStatus.waitingCount > 0) {
                this.metrics.poolExhaustionEvents++;
            }
            
            // Store health check result
            const healthCheck = await pool.healthCheck();
            this.metrics.healthCheckResults.push({
                ...healthCheck,
                timestamp: new Date().toISOString(),
                poolUtilization,
                queueLength: queueMetrics.currentQueueLength
            });
            
            // Keep only last 100 health check results
            if (this.metrics.healthCheckResults.length > 100) {
                this.metrics.healthCheckResults = this.metrics.healthCheckResults.slice(-100);
            }
            
        } catch (error) {
            console.error('❌ Error collecting database metrics:', error.message);
            this.metrics.connectionErrors++;
        }
    }

    // Check for alert conditions
    checkAlerts() {
        const currentTime = Date.now();
        
        // Check pool utilization
        const poolStatus = pool.getStatus();
        const poolUtilization = poolStatus.totalCount / poolStatus.max;
        
        if (poolUtilization > this.alertThresholds.maxPoolUtilization) {
            this.createAlert('HIGH_POOL_UTILIZATION', {
                current: poolUtilization,
                threshold: this.alertThresholds.maxPoolUtilization,
                poolStatus
            });
        }
        
        // Check error rate
        if (this.metrics.totalQueries > 0) {
            const errorRate = this.metrics.failedQueries / this.metrics.totalQueries;
            if (errorRate > this.alertThresholds.maxErrorRate) {
                this.createAlert('HIGH_ERROR_RATE', {
                    current: errorRate,
                    threshold: this.alertThresholds.maxErrorRate,
                    failedQueries: this.metrics.failedQueries,
                    totalQueries: this.metrics.totalQueries
                });
            }
        }
        
        // Check slow query rate
        if (this.metrics.totalQueries > 0) {
            const slowQueryRate = this.metrics.slowQueries / this.metrics.totalQueries;
            if (slowQueryRate > this.alertThresholds.maxSlowQueryRate) {
                this.createAlert('HIGH_SLOW_QUERY_RATE', {
                    current: slowQueryRate,
                    threshold: this.alertThresholds.maxSlowQueryRate,
                    slowQueries: this.metrics.slowQueries,
                    totalQueries: this.metrics.totalQueries
                });
            }
        }
        
        // Check connection health
        const recentHealthChecks = this.metrics.healthCheckResults.slice(-5);
        const unhealthyChecks = recentHealthChecks.filter(check => !check.healthy);
        
        if (unhealthyChecks.length >= 3) {
            this.createAlert('CONNECTION_HEALTH_DEGRADED', {
                unhealthyChecks: unhealthyChecks.length,
                totalChecks: recentHealthChecks.length,
                lastErrors: unhealthyChecks.map(check => check.error)
            });
        }
    }

    // Create an alert
    createAlert(type, data) {
        const alert = {
            id: `${type}_${Date.now()}`,
            type,
            severity: this.getAlertSeverity(type),
            message: this.getAlertMessage(type, data),
            data,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };
        
        this.alerts.push(alert);
        
        // Log alert
        console.warn(`🚨 Database Alert [${alert.severity}]: ${alert.message}`, data);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
    }

    // Get alert severity
    getAlertSeverity(type) {
        const severityMap = {
            HIGH_POOL_UTILIZATION: 'WARNING',
            HIGH_ERROR_RATE: 'ERROR',
            HIGH_SLOW_QUERY_RATE: 'WARNING',
            CONNECTION_HEALTH_DEGRADED: 'ERROR',
            POOL_EXHAUSTION: 'CRITICAL'
        };
        
        return severityMap[type] || 'INFO';
    }

    // Get alert message
    getAlertMessage(type, data) {
        const messageMap = {
            HIGH_POOL_UTILIZATION: `High pool utilization: ${(data.current * 100).toFixed(1)}% (threshold: ${(data.threshold * 100).toFixed(1)}%)`,
            HIGH_ERROR_RATE: `High error rate: ${(data.current * 100).toFixed(1)}% (threshold: ${(data.threshold * 100).toFixed(1)}%)`,
            HIGH_SLOW_QUERY_RATE: `High slow query rate: ${(data.current * 100).toFixed(1)}% (threshold: ${(data.threshold * 100).toFixed(1)}%)`,
            CONNECTION_HEALTH_DEGRADED: `Connection health degraded: ${data.unhealthyChecks}/${data.totalChecks} recent checks failed`,
            POOL_EXHAUSTION: 'Connection pool exhausted'
        };
        
        return messageMap[type] || 'Unknown alert type';
    }

    // Log current status
    logStatus() {
        const poolStatus = pool.getStatus();
        const connectionStatus = connectionManager.getStatus();
        const queueMetrics = pool.getQueueMetrics();
        
        console.log('📊 Database Status Report:', {
            timestamp: new Date().toISOString(),
            pool: {
                total: poolStatus.totalCount,
                idle: poolStatus.idleCount,
                waiting: poolStatus.waitingCount,
                max: poolStatus.max,
                utilization: `${((poolStatus.totalCount / poolStatus.max) * 100).toFixed(1)}%`
            },
            connections: {
                active: connectionStatus.activeConnections,
                total: connectionStatus.connections.length
            },
            queue: {
                current: queueMetrics.currentQueueLength,
                totalProcessed: queueMetrics.totalProcessed,
                averageWaitTime: `${queueMetrics.averageWaitTime.toFixed(0)}ms`
            },
            metrics: {
                totalQueries: this.metrics.totalQueries,
                successRate: this.metrics.totalQueries > 0 ? 
                    `${((this.metrics.successfulQueries / this.metrics.totalQueries) * 100).toFixed(1)}%` : 'N/A',
                slowQueries: this.metrics.slowQueries,
                failedQueries: this.metrics.failedQueries
            },
            alerts: {
                total: this.alerts.length,
                unacknowledged: this.alerts.filter(a => !a.acknowledged).length
            }
        });
    }

    // Track query execution
    trackQuery(startTime, success, error = null) {
        const queryTime = Date.now() - startTime;
        
        this.metrics.totalQueries++;
        
        if (success) {
            this.metrics.successfulQueries++;
        } else {
            this.metrics.failedQueries++;
            if (error) {
                this.metrics.connectionErrors++;
            }
        }
        
        // Track slow queries
        if (queryTime > this.alertThresholds.maxQueryTime) {
            this.metrics.slowQueries++;
        }
        
        // Update average query time
        this.metrics.averageQueryTime = 
            (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + queryTime) / this.metrics.totalQueries;
    }

    // Get comprehensive metrics report
    getMetricsReport() {
        const poolStatus = pool.getStatus();
        const connectionStatus = connectionManager.getStatus();
        const queueMetrics = pool.getQueueMetrics();
        
        return {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.metrics.startTime,
            pool: {
                ...poolStatus,
                utilization: poolStatus.totalCount / poolStatus.max,
                health: pool.healthCheck ? 'available' : 'unavailable'
            },
            connections: connectionStatus,
            queue: queueMetrics,
            metrics: {
                ...this.metrics,
                successRate: this.metrics.totalQueries > 0 ? 
                    this.metrics.successfulQueries / this.metrics.totalQueries : 0,
                errorRate: this.metrics.totalQueries > 0 ? 
                    this.metrics.failedQueries / this.metrics.totalQueries : 0
            },
            alerts: {
                total: this.alerts.length,
                unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
                recent: this.alerts.slice(-10)
            },
            thresholds: this.alertThresholds
        };
    }

    // Acknowledge an alert
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // Clear old alerts
    clearOldAlerts(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const cutoff = Date.now() - maxAge;
        this.alerts = this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
    }

    // Reset metrics
    resetMetrics() {
        this.metrics = {
            startTime: Date.now(),
            totalQueries: 0,
            successfulQueries: 0,
            failedQueries: 0,
            slowQueries: 0,
            queryTimeouts: 0,
            connectionErrors: 0,
            poolExhaustionEvents: 0,
            averageQueryTime: 0,
            peakConnections: 0,
            healthCheckResults: []
        };
        
        this.alerts = [];
        console.log('🔄 Database metrics reset');
    }
}

// Create singleton instance
const dbMonitor = new DatabaseMonitor();

// Auto-start monitoring if on server side
if (typeof window === 'undefined') {
    dbMonitor.start();
}

export default dbMonitor;

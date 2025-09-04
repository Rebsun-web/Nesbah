import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import connectionManager from '@/lib/connection-manager';
import dbMonitor from '@/lib/db-monitor';

export async function GET(req) {
    try {
        // Check if user has permission to view database health (admin only)
        // For now, we'll allow public access but you can add authentication here
        
        // Get comprehensive database health information
        const healthData = await getDatabaseHealth();
        
        return NextResponse.json({
            success: true,
            data: healthData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Failed to get database health:', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
            success: false,
            error: 'Failed to get database health information',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        console.log('🔧 Manual pool recovery triggered via POST request');
        
        // Attempt to recover the pool
        const recoveryResult = await pool.recover();
        
        if (recoveryResult) {
            console.log('✅ Manual pool recovery successful');
            
            // Get updated health data
            const healthData = await getDatabaseHealth();
            
            return NextResponse.json({
                success: true,
                message: 'Pool recovery successful',
                data: healthData,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('❌ Manual pool recovery failed');
            
            return NextResponse.json({
                success: false,
                error: 'Pool recovery failed',
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('Failed to recover pool:', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
            success: false,
            error: 'Failed to recover pool',
            details: error.message
        }, { status: 500 });
    }
}

// Get comprehensive database health information
async function getDatabaseHealth() {
    const startTime = Date.now();
    
    try {
        // Get pool status
        const poolStatus = pool.getStatus();
        const poolMetrics = pool.getMetrics();
        const queueMetrics = pool.getQueueMetrics();
        
        // Get connection manager status
        const connectionStatus = connectionManager.getStatus();
        const connectionMetrics = connectionManager.getMetrics();
        
        // Get database monitor metrics
        const monitorMetrics = dbMonitor.getMetricsReport();
        
        // Perform health check
        const healthCheck = await pool.healthCheck();
        
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Determine overall health status
        const overallHealth = determineOverallHealth({
            poolStatus,
            healthCheck,
            connectionStatus,
            monitorMetrics
        });
        
        return {
            status: overallHealth.status,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            
            // Pool information
            pool: {
                status: poolStatus,
                metrics: poolMetrics,
                queue: queueMetrics,
                health: healthCheck
            },
            
            // Connection information
            connections: {
                status: connectionStatus,
                metrics: connectionMetrics
            },
            
            // Monitoring information
            monitoring: monitorMetrics,
            
            // Performance metrics
            performance: {
                averageQueryTime: monitorMetrics.metrics.averageQueryTime,
                successRate: monitorMetrics.metrics.successRate,
                errorRate: monitorMetrics.metrics.errorRate,
                slowQueryRate: monitorMetrics.metrics.slowQueries / Math.max(monitorMetrics.metrics.totalQueries, 1)
            },
            
            // Alerts and warnings
            alerts: {
                total: monitorMetrics.alerts.total,
                unacknowledged: monitorMetrics.alerts.unacknowledged,
                recent: monitorMetrics.alerts.recent.slice(0, 5) // Last 5 alerts
            },
            
            // Recommendations
            recommendations: generateRecommendations({
                poolStatus,
                healthCheck,
                monitorMetrics
            })
        };
        
    } catch (error) {
        console.error('Error getting database health:', error);
        throw error;
    }
}

// Determine overall database health status
function determineOverallHealth({ poolStatus, healthCheck, connectionStatus, monitorMetrics }) {
    let status = 'healthy';
    let issues = [];
    
    // Check pool health
    if (!healthCheck.healthy) {
        status = 'critical';
        issues.push('Database connection health check failed');
    }
    
    // Check pool utilization
    const poolUtilization = poolStatus.totalCount / poolStatus.max;
    if (poolUtilization > 0.9) {
        status = status === 'healthy' ? 'warning' : status;
        issues.push(`High pool utilization: ${(poolUtilization * 100).toFixed(1)}%`);
    }
    
    // Check waiting connections
    if (poolStatus.waitingCount > 0) {
        status = status === 'healthy' ? 'warning' : status;
        issues.push(`${poolStatus.waitingCount} connections waiting`);
    }
    
    // Check error rate
    if (monitorMetrics.metrics.errorRate > 0.05) { // 5%
        status = status === 'healthy' ? 'warning' : status;
        issues.push(`High error rate: ${(monitorMetrics.metrics.errorRate * 100).toFixed(1)}%`);
    }
    
    // Check slow queries
    if (monitorMetrics.metrics.slowQueries > 0) {
        status = status === 'healthy' ? 'warning' : status;
        issues.push(`${monitorMetrics.metrics.slowQueries} slow queries detected`);
    }
    
    // Check active connections
    if (connectionStatus.activeConnections > poolStatus.max * 0.8) {
        status = status === 'healthy' ? 'warning' : status;
        issues.push(`High number of active connections: ${connectionStatus.activeConnections}`);
    }
    
    // Check for critical alerts
    const criticalAlerts = monitorMetrics.alerts.recent.filter(alert => 
        alert.severity === 'CRITICAL' || alert.severity === 'ERROR'
    );
    
    if (criticalAlerts.length > 0) {
        status = 'critical';
        issues.push(`${criticalAlerts.length} critical alerts active`);
    }
    
    return {
        status,
        issues,
        lastCheck: new Date().toISOString()
    };
}

// Generate recommendations based on current status
function generateRecommendations({ poolStatus, healthCheck, monitorMetrics }) {
    const recommendations = [];
    
    // Pool utilization recommendations
    const poolUtilization = poolStatus.totalCount / poolStatus.max;
    if (poolUtilization > 0.8) {
        recommendations.push({
            type: 'pool_optimization',
            priority: 'medium',
            message: 'Consider increasing max connections or optimizing query performance',
            action: 'Review connection pool configuration and query patterns'
        });
    }
    
    // Error rate recommendations
    if (monitorMetrics.metrics.errorRate > 0.1) {
        recommendations.push({
            type: 'error_handling',
            priority: 'high',
            message: 'High error rate detected - investigate database connectivity and query issues',
            action: 'Check database logs and review error patterns'
        });
    }
    
    // Slow query recommendations
    if (monitorMetrics.metrics.slowQueries > 0) {
        recommendations.push({
            type: 'performance',
            priority: 'medium',
            message: 'Slow queries detected - consider query optimization',
            action: 'Review and optimize slow-running queries'
        });
    }
    
    // Connection health recommendations
    if (!healthCheck.healthy) {
        recommendations.push({
            type: 'connectivity',
            priority: 'critical',
            message: 'Database connectivity issues detected',
            action: 'Check database server status and network connectivity'
        });
    }
    
    // Queue recommendations
    if (monitorMetrics.queue.currentQueueLength > 0) {
        recommendations.push({
            type: 'capacity',
            priority: 'medium',
            message: 'Connection requests are queued - consider increasing pool capacity',
            action: 'Review connection pool settings and server resources'
        });
    }
    
    return recommendations;
}

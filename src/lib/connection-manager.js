// Connection manager - server-side only
class ConnectionManager {
    constructor() {
        this.activeConnections = new Map(); // Track connections by page/component ID
        this.connectionTimeouts = new Map(); // Track timeouts for auto-cleanup
        this.cleanupInterval = null;
        this.maxConnectionAge = 15000; // Reduced from 30000 to 15000 (15 seconds)
        this.connectionRetryAttempts = 2; // Reduced from 3 to 2
        this.connectionRetryDelay = 500; // Reduced from 1000 to 500ms
        this.healthCheckInterval = null;
        this.connectionMetrics = {
            totalConnections: 0,
            failedConnections: 0,
            timeoutConnections: 0,
            avgConnectionTime: 0,
            connectionErrors: new Map()
        };
        
        // Emergency cleanup threshold
        this.emergencyCleanupThreshold = 3; // If we have more than 3 active connections, force cleanup
    }

    // Initialize the connection manager
    init() {
        // Only run on server side
        if (typeof window !== 'undefined') {
            console.log('⚠️ Connection Manager should only be used on server side');
            return;
        }

        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleConnections();
        }, 5000); // Check every 5 seconds (reduced from 10)

        // Start health check interval
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 120000); // Check every 2 minutes (reduced frequency to prevent connection overhead)

        console.log('🔧 Connection Manager initialized with enhanced monitoring');
    }

    // Get a connection for a specific page/component with enhanced error handling
    async getConnection(pageId, componentId = null) {
        if (typeof window !== 'undefined') {
            throw new Error('Connection Manager not available on client side');
        }

        const connectionKey = componentId ? `${pageId}:${componentId}` : pageId;
        const startTime = Date.now();
        
        try {
            // Dynamic import to avoid client-side issues
            const pool = await import('./db.js').then(m => m.default);
            
            // Attempt to get connection with retry logic
            const client = await this.connectWithRetry(pool, connectionKey);
            
            // Track the connection with enhanced metadata
            this.activeConnections.set(connectionKey, {
                client,
                timestamp: Date.now(),
                pageId,
                componentId,
                connectionTime: Date.now() - startTime,
                lastActivity: Date.now()
            });

            // Update metrics
            this.connectionMetrics.totalConnections++;
            this.updateAverageConnectionTime(Date.now() - startTime);

            // Set timeout for auto-cleanup
            const timeout = setTimeout(() => {
                this.handleConnectionTimeout(connectionKey);
            }, this.maxConnectionAge);

            this.connectionTimeouts.set(connectionKey, timeout);

            console.log(`🔗 Connection acquired for ${connectionKey}. Active connections: ${this.activeConnections.size}`);
            
            return client;
        } catch (error) {
            // Enhanced error handling and logging
            this.handleConnectionError(connectionKey, error);
            throw error;
        }
    }

    // Enhanced connection retry logic
    async connectWithRetry(pool, connectionKey, attempt = 1) {
        try {
            return await pool.connectWithRetry();
        } catch (error) {
            if (attempt < this.connectionRetryAttempts && this.isRetryableError(error)) {
                console.warn(`⚠️ Connection attempt ${attempt} failed for ${connectionKey}, retrying in ${this.connectionRetryDelay}ms...`);
                await this.delay(this.connectionRetryDelay);
                return this.connectWithRetry(pool, connectionKey, attempt + 1);
            }
            throw error;
        }
    }

    // Check if error is retryable
    isRetryableError(error) {
        const retryableCodes = [
            '53300', // connection slots are reserved
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND'
        ];
        
        return retryableCodes.includes(error.code) || 
               error.message.includes('connection slots are reserved') ||
               error.message.includes('timeout');
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Handle connection errors with detailed logging
    handleConnectionError(connectionKey, error) {
        this.connectionMetrics.failedConnections++;
        
        // Track error types
        const errorType = error.code || 'UNKNOWN';
        const currentCount = this.connectionMetrics.connectionErrors.get(errorType) || 0;
        this.connectionMetrics.connectionErrors.set(errorType, currentCount + 1);
        
        console.error(`❌ Failed to get connection for ${connectionKey}:`, {
            error: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    // Handle connection timeouts
    handleConnectionTimeout(connectionKey) {
        this.connectionMetrics.timeoutConnections++;
        console.warn(`⏰ Connection timeout for ${connectionKey}`);
        this.releaseConnection(connectionKey);
    }

    // Release a specific connection with enhanced error handling
    releaseConnection(connectionKey) {
        const connection = this.activeConnections.get(connectionKey);
        if (connection) {
            try {
                // Check if client is still valid before releasing
                if (connection.client && !connection.client.released) {
                    connection.client.release();
                }
                
                this.activeConnections.delete(connectionKey);
                
                // Clear timeout
                const timeout = this.connectionTimeouts.get(connectionKey);
                if (timeout) {
                    clearTimeout(timeout);
                    this.connectionTimeouts.delete(connectionKey);
                }

                console.log(`🔓 Connection released for ${connectionKey}. Active connections: ${this.activeConnections.size}`);
            } catch (error) {
                console.error(`❌ Error releasing connection for ${connectionKey}:`, error.message);
            }
        }
    }

    // Release all connections for a specific page
    releasePageConnections(pageId) {
        const keysToRelease = [];
        
        for (const [key, connection] of this.activeConnections.entries()) {
            if (connection.pageId === pageId) {
                keysToRelease.push(key);
            }
        }

        keysToRelease.forEach(key => {
            this.releaseConnection(key);
        });

        console.log(`🧹 Released ${keysToRelease.length} connections for page ${pageId}`);
    }

    // Release all active connections
    cleanupAllConnections() {
        const connectionKeys = Array.from(this.activeConnections.keys());
        
        connectionKeys.forEach(key => {
            this.releaseConnection(key);
        });

        console.log(`🧹 Cleaned up all ${connectionKeys.length} active connections`);
    }

    // Cleanup stale connections (older than maxConnectionAge)
    cleanupStaleConnections() {
        const now = Date.now();
        const keysToRelease = [];

        // Emergency cleanup: if we have too many connections, force cleanup
        if (this.activeConnections.size > this.emergencyCleanupThreshold) {
            console.warn(`🚨 Emergency cleanup: ${this.activeConnections.size} active connections (threshold: ${this.emergencyCleanupThreshold})`);
            
            // Force cleanup all connections older than 10 seconds
            for (const [key, connection] of this.activeConnections.entries()) {
                if (now - connection.timestamp > 10000) { // 10 seconds
                    keysToRelease.push(key);
                }
            }
            
            // If still too many, force cleanup oldest connections
            if (this.activeConnections.size - keysToRelease.length > this.emergencyCleanupThreshold) {
                const remainingConnections = Array.from(this.activeConnections.entries())
                    .filter(([key]) => !keysToRelease.includes(key))
                    .sort((a, b) => a[1].timestamp - b[1].timestamp);
                
                const additionalToRelease = remainingConnections
                    .slice(0, this.activeConnections.size - this.emergencyCleanupThreshold)
                    .map(([key]) => key);
                
                keysToRelease.push(...additionalToRelease);
            }
        } else {
            // Normal cleanup: connections older than maxConnectionAge
            for (const [key, connection] of this.activeConnections.entries()) {
                if (now - connection.timestamp > this.maxConnectionAge) {
                    keysToRelease.push(key);
                }
            }
        }

        keysToRelease.forEach(key => {
            this.releaseConnection(key);
        });

        if (keysToRelease.length > 0) {
            console.log(`🧹 Cleaned up ${keysToRelease.length} connections (${this.activeConnections.size} remaining)`);
        }
    }

    // Perform health check on active connections
    async performHealthCheck() {
        const unhealthyConnections = [];
        
        for (const [key, connection] of this.activeConnections.entries()) {
            try {
                // Test connection with a simple query
                await connection.client.query('SELECT 1');
                connection.lastActivity = Date.now();
            } catch (error) {
                console.warn(`⚠️ Unhealthy connection detected for ${key}:`, error.message);
                unhealthyConnections.push(key);
            }
        }

        // Release unhealthy connections
        unhealthyConnections.forEach(key => {
            this.releaseConnection(key);
        });

        if (unhealthyConnections.length > 0) {
            console.log(`🔧 Released ${unhealthyConnections.length} unhealthy connections`);
        }

        // Log connection pool status
        this.logConnectionPoolStatus();
    }

    // Log connection pool status
    async logConnectionPoolStatus() {
        try {
            const pool = await import('./db.js').then(m => m.default);
            const status = pool.getStatus();
            
            console.log(`📊 Connection Pool Status:`, {
                total: status.totalCount,
                idle: status.idleCount,
                waiting: status.waitingCount,
                max: status.max,
                activeConnections: this.activeConnections.size,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Failed to get pool status:', error.message);
        }
    }

    // Update average connection time
    updateAverageConnectionTime(connectionTime) {
        const { totalConnections, avgConnectionTime } = this.connectionMetrics;
        this.connectionMetrics.avgConnectionTime = 
            (avgConnectionTime * (totalConnections - 1) + connectionTime) / totalConnections;
    }

    // Get connection status with enhanced metrics
    getStatus() {
        return {
            activeConnections: this.activeConnections.size,
            connections: Array.from(this.activeConnections.entries()).map(([key, conn]) => ({
                key,
                pageId: conn.pageId,
                componentId: conn.componentId,
                age: Date.now() - conn.timestamp,
                lastActivity: Date.now() - conn.lastActivity,
                connectionTime: conn.connectionTime
            })),
            metrics: {
                ...this.connectionMetrics,
                connectionErrors: Object.fromEntries(this.connectionMetrics.connectionErrors)
            }
        };
    }

    // Get detailed connection metrics
    getMetrics() {
        return {
            ...this.connectionMetrics,
            connectionErrors: Object.fromEntries(this.connectionMetrics.connectionErrors),
            timestamp: new Date().toISOString()
        };
    }

    // Stop the connection manager
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        this.cleanupAllConnections();
        console.log('🛑 Connection Manager stopped');
    }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

// Auto-initialize if on server side
if (typeof window === 'undefined') {
    connectionManager.init();
}

export default connectionManager;
import pool from './db.js';

class ConnectionManager {
    constructor() {
        this.activeConnections = new Map(); // Track connections by page/component ID
        this.connectionTimeouts = new Map(); // Track timeouts for auto-cleanup
        this.cleanupInterval = null;
        this.maxConnectionAge = 30000; // 30 seconds max connection age
    }

    // Initialize the connection manager
    init() {
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleConnections();
        }, 10000); // Check every 10 seconds

        // Listen for page unload events
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.cleanupAllConnections();
            });

            // Listen for route changes (Next.js)
            if (typeof window !== 'undefined' && window.history) {
                const originalPushState = window.history.pushState;
                const originalReplaceState = window.history.replaceState;

                window.history.pushState = (...args) => {
                    this.cleanupAllConnections();
                    return originalPushState.apply(window.history, args);
                };

                window.history.replaceState = (...args) => {
                    this.cleanupAllConnections();
                    return originalReplaceState.apply(window.history, args);
                };
            }
        }

        console.log('🔧 Connection Manager initialized');
    }

    // Get a connection for a specific page/component
    async getConnection(pageId, componentId = null) {
        const connectionKey = componentId ? `${pageId}:${componentId}` : pageId;
        
        try {
            const client = await pool.connectWithRetry();
            
            // Track the connection
            this.activeConnections.set(connectionKey, {
                client,
                timestamp: Date.now(),
                pageId,
                componentId
            });

            // Set timeout for auto-cleanup
            const timeout = setTimeout(() => {
                this.releaseConnection(connectionKey);
            }, this.maxConnectionAge);

            this.connectionTimeouts.set(connectionKey, timeout);

            console.log(`🔗 Connection acquired for ${connectionKey}. Active connections: ${this.activeConnections.size}`);
            
            return client;
        } catch (error) {
            console.error(`❌ Failed to get connection for ${connectionKey}:`, error.message);
            throw error;
        }
    }

    // Release a specific connection
    releaseConnection(connectionKey) {
        const connection = this.activeConnections.get(connectionKey);
        if (connection) {
            try {
                connection.client.release();
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

        for (const [key, connection] of this.activeConnections.entries()) {
            if (now - connection.timestamp > this.maxConnectionAge) {
                keysToRelease.push(key);
            }
        }

        keysToRelease.forEach(key => {
            this.releaseConnection(key);
        });

        if (keysToRelease.length > 0) {
            console.log(`🧹 Cleaned up ${keysToRelease.length} stale connections`);
        }
    }

    // Get connection status
    getStatus() {
        return {
            activeConnections: this.activeConnections.size,
            connections: Array.from(this.activeConnections.entries()).map(([key, conn]) => ({
                key,
                pageId: conn.pageId,
                componentId: conn.componentId,
                age: Date.now() - conn.timestamp
            }))
        };
    }

    // Stop the connection manager
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        this.cleanupAllConnections();
        console.log('🛑 Connection Manager stopped');
    }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    connectionManager.init();
}

export default connectionManager;

// Background Connection Manager - ensures proper connection cleanup for background tasks
import pool from './db.js'

class BackgroundConnectionManager {
    constructor() {
        this.activeConnections = new Map()
        this.connectionTimeout = 10000 // 10 seconds max - further reduced to prevent exhaustion
        this.maxRetries = 1 // Minimal retries
        this.retryDelay = 2000 // Reduced delay
    }

    // Get a connection with timeout and retry logic
    async getConnection(taskName) {
        // Check if we already have too many active connections
        if (this.activeConnections.size >= 3) {
            console.warn(`⚠️ Too many active connections (${this.activeConnections.size}), waiting...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        const connectionId = `${taskName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        try {
            // Get connection with timeout
            const client = await Promise.race([
                pool.connectWithRetry(1, 1000, 'background-connection-manager'), // Reduced retries
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout)
                )
            ])

            // Track the connection
            this.activeConnections.set(connectionId, {
                client,
                taskName,
                acquiredAt: Date.now(),
                timeout: setTimeout(() => {
                    this.forceReleaseConnection(connectionId)
                }, this.connectionTimeout)
            })

            console.log(`🔗 Connection acquired for ${taskName} (ID: ${connectionId})`)
            return { client, connectionId }

        } catch (error) {
            console.error(`❌ Failed to get connection for ${taskName}:`, error.message)
            throw error
        }
    }

    // Release a specific connection
    releaseConnection(connectionId) {
        const connection = this.activeConnections.get(connectionId)
        if (!connection) {
            console.warn(`⚠️ Connection ${connectionId} not found for release`)
            return
        }

        try {
            // Clear timeout
            if (connection.timeout) {
                clearTimeout(connection.timeout)
            }

            // Release the client
            connection.client.release()
            
            // Remove from tracking
            this.activeConnections.delete(connectionId)
            
            console.log(`🔓 Connection ${connectionId} released successfully`)
        } catch (error) {
            console.error(`❌ Error releasing connection ${connectionId}:`, error.message)
        }
    }

    // Force release a connection (emergency cleanup)
    forceReleaseConnection(connectionId) {
        const connection = this.activeConnections.get(connectionId)
        if (!connection) return

        try {
            console.warn(`⚠️ Force releasing connection ${connectionId} for ${connection.taskName}`)
            
            // Clear timeout
            if (connection.timeout) {
                clearTimeout(connection.timeout)
            }

            // Force release the client
            connection.client.release()
            
            // Remove from tracking
            this.activeConnections.delete(connectionId)
            
            console.log(`🔓 Connection ${connectionId} force released`)
        } catch (error) {
            console.error(`❌ Error force releasing connection ${connectionId}:`, error.message)
        }
    }

    // Execute a task with automatic connection management
    async executeWithConnection(taskName, taskFunction) {
        let connection = null
        
        try {
            // Get connection
            connection = await this.getConnection(taskName)
            
            // Execute the task
            const result = await taskFunction(connection.client)
            
            return result
            
        } catch (error) {
            console.error(`❌ Task ${taskName} failed:`, error.message)
            throw error
            
        } finally {
            // Always release the connection
            if (connection) {
                this.releaseConnection(connection.connectionId)
            }
        }
    }

    // Get connection status
    getStatus() {
        const now = Date.now()
        const activeConnections = Array.from(this.activeConnections.entries()).map(([id, conn]) => ({
            id,
            taskName: conn.taskName,
            age: now - conn.acquiredAt,
            isStale: (now - conn.acquiredAt) > this.connectionTimeout
        }))

        return {
            totalActive: this.activeConnections.size,
            connections: activeConnections,
            staleConnections: activeConnections.filter(conn => conn.isStale).length
        }
    }

    // Cleanup stale connections
    cleanupStaleConnections() {
        const now = Date.now()
        let cleanedCount = 0

        for (const [id, connection] of this.activeConnections.entries()) {
            if ((now - connection.acquiredAt) > this.connectionTimeout) {
                console.warn(`🧹 Cleaning up stale connection ${id} for ${connection.taskName}`)
                this.forceReleaseConnection(id)
                cleanedCount++
            }
        }

        if (cleanedCount > 0) {
            console.log(`✅ Cleaned up ${cleanedCount} stale connections`)
        }

        return cleanedCount
    }

    // Emergency cleanup - release all connections
    async emergencyCleanup() {
        console.log('🚨 Emergency connection cleanup initiated...')
        
        const connectionIds = Array.from(this.activeConnections.keys())
        let cleanedCount = 0

        for (const id of connectionIds) {
            this.forceReleaseConnection(id)
            cleanedCount++
        }

        console.log(`✅ Emergency cleanup completed: ${cleanedCount} connections released`)
        return cleanedCount
    }

    // Release all connections (alias for emergencyCleanup for compatibility)
    async releaseAllConnections() {
        return await this.emergencyCleanup()
    }

    // Health check
    async healthCheck() {
        try {
            const status = this.getStatus()
            const poolStatus = pool.getStatus()
            
            return {
                healthy: status.totalActive < 10 && poolStatus.waitingCount === 0,
                backgroundConnections: status,
                poolStatus: poolStatus,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        }
    }
}

// Export singleton instance
const backgroundConnectionManager = new BackgroundConnectionManager()

// Auto-cleanup stale connections every 5 minutes
if (typeof window === 'undefined') {
    setInterval(() => {
        backgroundConnectionManager.cleanupStaleConnections()
    }, 5 * 60 * 1000)
}

export default backgroundConnectionManager

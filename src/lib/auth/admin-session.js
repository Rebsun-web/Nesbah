import pool from '../db.cjs';
import jwt from 'jsonwebtoken';

class AdminSessionManager {
    constructor() {
        this.activeSessions = new Map(); // Store active sessions in memory
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.cleanupInterval = null;
    }

    // Initialize session manager
    init() {
        // Clean up expired sessions every hour
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupExpiredSessions();
        }, 60 * 60 * 1000); // Every hour

        console.log('🔐 Admin Session Manager initialized');
    }

    // Create a new admin session
    async createSession(adminUser) {
        const sessionId = this.generateSessionId();
        const expiresAt = Date.now() + this.sessionTimeout;

        const session = {
            sessionId,
            adminId: adminUser.admin_id,
            email: adminUser.email,
            fullName: adminUser.full_name,
            role: adminUser.role,
            permissions: adminUser.permissions,
            isActive: adminUser.is_active,
            createdAt: Date.now(),
            expiresAt,
            lastActivity: Date.now()
        };

        // Store session in memory
        this.activeSessions.set(sessionId, session);

        // Also save to database for persistence across server restarts
        try {
            await this.saveSessionToDatabase(session);
            console.log(`🔐 Session stored in memory and database: ${sessionId}`);
        } catch (error) {
            console.log(`🔐 Session stored in memory only (database failed): ${sessionId}`);
        }

        // Generate JWT token with session info
        const token = jwt.sign(
            {
                sessionId,
                adminId: adminUser.admin_id,
                email: adminUser.email,
                role: adminUser.role,
                type: 'admin_session'
            },
            process.env.JWT_SECRET || 'nesbah-admin-secret-key-2024',
            { expiresIn: '24h' }
        );

        console.log(`🔐 Admin session created for ${adminUser.email} (${sessionId})`);

        return {
            token,
            sessionId,
            expiresAt,
            adminUser: {
                admin_id: adminUser.admin_id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                is_active: adminUser.is_active
            }
        };
    }

    // Validate admin session from token
    async validateSession(token) {
        try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nesbah-admin-secret-key-2024');
            
            if (decoded.type !== 'admin_session') {
                return { valid: false, error: 'Invalid token type' };
            }

            // Get session from memory only (temporarily disable database fallback due to connection pool issues)
            let session = this.activeSessions.get(decoded.sessionId);
            
            // If not in memory, session is invalid (don't try database to avoid connection issues)
            if (!session) {
                console.log(`🔧 Session not found in memory: ${decoded.sessionId}`);
                return { valid: false, error: 'Session not found' };
            }

            // Check if session is expired
            if (Date.now() > session.expiresAt) {
                this.activeSessions.delete(decoded.sessionId);
                return { valid: false, error: 'Session expired' };
            }

            // Check if admin is still active
            if (!session.isActive) {
                this.activeSessions.delete(decoded.sessionId);
                return { valid: false, error: 'Admin account inactive' };
            }

            // Update last activity
            session.lastActivity = Date.now();

            return {
                valid: true,
                session,
                adminUser: {
                    admin_id: session.adminId,
                    email: session.email,
                    full_name: session.fullName,
                    role: session.role,
                    permissions: session.permissions,
                    is_active: session.isActive
                }
            };

        } catch (error) {
            console.error('Session validation error:', error);
            return { valid: false, error: 'Invalid token' };
        }
    }

    // Refresh session (extend timeout)
    refreshSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        
        if (session) {
            session.expiresAt = Date.now() + this.sessionTimeout;
            session.lastActivity = Date.now();
            
            console.log(`🔄 Session refreshed for ${session.email}`);
            return true;
        }
        
        return false;
    }

    // Invalidate session (logout)
    async invalidateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        
        if (session) {
            this.activeSessions.delete(sessionId);
            console.log(`🚪 Session invalidated for ${session.email}`);
            
            // Also remove from database
            try {
                await this.removeSessionFromDatabase(sessionId);
            } catch (error) {
                console.error('Error removing session from database:', error);
            }
            
            return true;
        }
        
        return false;
    }

    // Invalidate all sessions for an admin
    invalidateAllSessionsForAdmin(adminId) {
        let count = 0;
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.adminId === adminId) {
                this.activeSessions.delete(sessionId);
                count++;
            }
        }
        
        if (count > 0) {
            console.log(`🚪 Invalidated ${count} sessions for admin ${adminId}`);
        }
        
        return count;
    }

    // Clean up expired sessions
    async cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Clean up memory sessions
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (now > session.expiresAt) {
                this.activeSessions.delete(sessionId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired admin sessions from memory`);
        }
        
        // Clean up database sessions
        try {
            const client = await pool.connectWithRetry();
            try {
                const result = await client.query(
                    'DELETE FROM admin_sessions WHERE expires_at < NOW() RETURNING session_id'
                );
                
                if (result.rows.length > 0) {
                    console.log(`🧹 Cleaned up ${result.rows.length} expired admin sessions from database`);
                }
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error cleaning up expired sessions from database:', error);
        }
    }

    // Get session statistics
    getSessionStats() {
        const now = Date.now();
        const activeSessions = Array.from(this.activeSessions.values());
        
        return {
            totalSessions: activeSessions.length,
            activeSessions: activeSessions.filter(s => now <= s.expiresAt).length,
            expiredSessions: activeSessions.filter(s => now > s.expiresAt).length,
            sessionsByRole: activeSessions.reduce((acc, session) => {
                acc[session.role] = (acc[session.role] || 0) + 1;
                return acc;
            }, {})
        };
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get session from database
    async getSessionFromDatabase(sessionId) {
        try {
            const client = await pool.connectWithRetry();
            try {
                const result = await client.query(
                    'SELECT * FROM admin_sessions WHERE session_id = $1 AND expires_at > NOW()',
                    [sessionId]
                );
                
                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    return {
                        sessionId: row.session_id,
                        adminId: row.admin_id,
                        email: row.email,
                        fullName: row.full_name,
                        role: row.role,
                        permissions: row.permissions,
                        isActive: row.is_active,
                        createdAt: row.created_at.getTime(),
                        expiresAt: row.expires_at.getTime(),
                        lastActivity: row.last_activity.getTime()
                    };
                }
                return null;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error getting session from database:', error);
            // Don't throw, just return null to indicate no session found
            return null;
        }
    }

    // Save session to database
    async saveSessionToDatabase(session) {
        try {
            const client = await pool.connectWithRetry();
            try {
                await client.query(
                    `INSERT INTO admin_sessions 
                        (session_id, admin_id, email, full_name, role, permissions, is_active, created_at, expires_at, last_activity)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (session_id) DO UPDATE SET
                        last_activity = $10,
                        expires_at = $9`,
                    [
                        session.sessionId,
                        session.adminId,
                        session.email,
                        session.fullName,
                        session.role,
                        JSON.stringify(session.permissions),
                        session.isActive,
                        new Date(session.createdAt),
                        new Date(session.expiresAt),
                        new Date(session.lastActivity)
                    ]
                );
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error saving session to database:', error);
        }
    }

    // Remove session from database
    async removeSessionFromDatabase(sessionId) {
        try {
            const client = await pool.connectWithRetry();
            try {
                await client.query(
                    'DELETE FROM admin_sessions WHERE session_id = $1',
                    [sessionId]
                );
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error removing session from database:', error);
        }
    }

    // Stop session manager
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        this.activeSessions.clear();
        console.log('🛑 Admin Session Manager stopped');
    }
}

// Create singleton instance
const adminSessionManager = new AdminSessionManager();

// Auto-initialize only on server side
if (typeof window === 'undefined') {
    adminSessionManager.init();
}

export default adminSessionManager;

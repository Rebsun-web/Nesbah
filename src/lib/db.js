// Server-side only database connection
let pool = null;

if (typeof window === 'undefined') {
    // Only import pg on server side
    const { Pool } = require('pg');
    
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Connection pool configuration
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    });
}

class DatabasePool {
    async connectWithRetry() {
        if (!pool) {
            throw new Error('Database connection not available on client side');
        }
        
        try {
            const client = await pool.connect();
            return {
                query: client.query.bind(client),
                release: client.release.bind(client)
            };
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    // Direct query method for compatibility with routes that use pool.query()
    async query(text, params) {
        if (!pool) {
            throw new Error('Database connection not available on client side');
        }
        return await pool.query(text, params);
    }

    // Add withConnection method for compatibility with admin routes
    async withConnection(callback) {
        if (!pool) {
            throw new Error('Database connection not available on client side');
        }
        
        const client = await pool.connect();
        try {
            return await callback(client);
        } finally {
            client.release();
        }
    }
}

export default new DatabasePool();

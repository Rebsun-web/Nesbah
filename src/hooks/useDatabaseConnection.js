import { useEffect, useRef, useState } from 'react';
import connectionManager from '@/lib/connection-manager';

/**
 * Hook for managing database connections in React components
 * Automatically cleans up connections when component unmounts or page changes
 */
export function useDatabaseConnection(pageId, componentId = null) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const connectionRef = useRef(null);
    const connectionKey = componentId ? `${pageId}:${componentId}` : pageId;

    // Get a database connection
    const getConnection = async () => {
        const startTime = Date.now();
        
        try {
            setError(null);
            const client = await connectionManager.getConnection(pageId, componentId);
            connectionRef.current = client;
            setIsConnected(true);
            
            // Track successful connection
            if (typeof window === 'undefined') {
                const dbMonitor = await import('@/lib/db-monitor').then(m => m.default);
                dbMonitor.trackQuery(startTime, true);
            }
            
            return client;
        } catch (err) {
            setError(err.message);
            setIsConnected(false);
            
            // Track failed connection
            if (typeof window === 'undefined') {
                const dbMonitor = await import('@/lib/db-monitor').then(m => m.default);
                dbMonitor.trackQuery(startTime, false, err);
            }
            
            throw err;
        }
    };

    // Release the current connection
    const releaseConnection = () => {
        if (connectionRef.current) {
            try {
                connectionManager.releaseConnection(connectionKey);
                connectionRef.current = null;
                setIsConnected(false);
            } catch (err) {
                console.error('Error releasing connection:', {
                    error: err.message,
                    connectionKey,
                    timestamp: new Date().toISOString()
                });
            }
        }
    };

    // Execute a query with automatic connection management and monitoring
    const executeQuery = async (query, params = [], options = {}) => {
        const startTime = Date.now();
        const { timeout = 30000, retries = 3 } = options;
        
        let client = connectionRef.current;
        
        if (!client) {
            client = await getConnection();
        }

        try {
            // Set query timeout if supported
            if (client.query && typeof client.query === 'function') {
                try {
                    await client.query(`SET statement_timeout = ${timeout}`);
                } catch (timeoutError) {
                    // Ignore timeout setting errors for older PostgreSQL versions
                    console.warn('Could not set statement timeout:', timeoutError.message);
                }
            }
            
            const result = await Promise.race([
                client.query(query, params),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Query timeout')), timeout)
                )
            ]);
            
            // Track successful query
            if (typeof window === 'undefined') {
                const dbMonitor = await import('@/lib/db-monitor').then(m => m.default);
                dbMonitor.trackQuery(startTime, true);
            }
            
            return result;
        } catch (err) {
            // Track failed query
            if (typeof window === 'undefined') {
                const dbMonitor = await import('@/lib/db-monitor').then(m => m.default);
                dbMonitor.trackQuery(startTime, false, err);
            }
            
            setError(err.message);
            
            // Enhanced error logging
            console.error('Database query failed:', {
                error: err.message,
                code: err.code,
                query: query.substring(0, 100) + '...',
                params: params.length > 0 ? params : 'none',
                connectionKey,
                timestamp: new Date().toISOString()
            });
            
            throw err;
        }
    };

    // Execute a query with retry logic
    const executeQueryWithRetry = async (query, params = [], options = {}) => {
        const { maxRetries = 3, delay = 1000, timeout = 30000 } = options;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await executeQuery(query, params, { timeout });
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries && isRetryableError(error)) {
                    console.warn(`Query attempt ${attempt} failed, retrying in ${delay}ms...`, {
                        error: error.message,
                        connectionKey,
                        attempt,
                        maxRetries
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Exponential backoff
                    continue;
                }
                
                break;
            }
        }
        
        throw lastError;
    };

    // Check if error is retryable
    const isRetryableError = (error) => {
        const retryableCodes = [
            '53300', // connection slots are reserved
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            '57P01', // terminating connection due to administrator command
            '57P02'  // terminating connection due to crash
        ];
        
        return retryableCodes.includes(error.code) || 
               error.message.includes('connection slots are reserved') ||
               error.message.includes('timeout') ||
               error.message.includes('terminating connection');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            releaseConnection();
        };
    }, []);

    // Cleanup on page change
    useEffect(() => {
        const handleRouteChange = () => {
            releaseConnection();
        };

        // Listen for route changes
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleRouteChange);
            
            return () => {
                window.removeEventListener('beforeunload', handleRouteChange);
            };
        }
    }, []);

    return {
        getConnection,
        releaseConnection,
        executeQuery,
        executeQueryWithRetry,
        isConnected,
        error,
        connectionKey,
        isRetryableError
    };
}

/**
 * Hook for components that need to execute a single query
 * Automatically manages connection lifecycle with enhanced monitoring
 */
export function useDatabaseQuery(pageId, componentId = null) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { getConnection, releaseConnection, executeQuery, executeQueryWithRetry } = useDatabaseConnection(pageId, componentId);

    const executeQueryWithMonitoring = async (query, params = [], options = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await executeQuery(query, params, options);
            setData(result.rows);
            return result.rows;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
            releaseConnection();
        }
    };

    const executeQueryWithRetryAndMonitoring = async (query, params = [], options = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await executeQueryWithRetry(query, params, options);
            setData(result.rows);
            return result.rows;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
            releaseConnection();
        }
    };

    return {
        executeQuery: executeQueryWithMonitoring,
        executeQueryWithRetry: executeQueryWithRetryAndMonitoring,
        data,
        loading,
        error
    };
}

/**
 * Hook for components that need to execute multiple queries
 * Keeps connection open until explicitly released with enhanced monitoring
 */
export function useDatabaseTransaction(pageId, componentId = null) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const { getConnection, releaseConnection, executeQuery } = useDatabaseConnection(pageId, componentId);

    const startTransaction = async () => {
        try {
            const client = await getConnection();
            await executeQuery('BEGIN');
            setIsConnected(true);
            return client;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const commitTransaction = async () => {
        try {
            if (isConnected) {
                await executeQuery('COMMIT');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            releaseConnection();
            setIsConnected(false);
        }
    };

    const rollbackTransaction = async () => {
        try {
            if (isConnected) {
                await executeQuery('ROLLBACK');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            releaseConnection();
            setIsConnected(false);
        }
    };

    return {
        startTransaction,
        commitTransaction,
        rollbackTransaction,
        isConnected,
        error
    };
}

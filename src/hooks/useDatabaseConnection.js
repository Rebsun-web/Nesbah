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
        try {
            setError(null);
            const client = await connectionManager.getConnection(pageId, componentId);
            connectionRef.current = client;
            setIsConnected(true);
            return client;
        } catch (err) {
            setError(err.message);
            setIsConnected(false);
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
                console.error('Error releasing connection:', err);
            }
        }
    };

    // Execute a query with automatic connection management
    const executeQuery = async (query, params = []) => {
        let client = connectionRef.current;
        
        if (!client) {
            client = await getConnection();
        }

        try {
            const result = await client.query(query, params);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
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
        isConnected,
        error,
        connectionKey
    };
}

/**
 * Hook for components that need to execute a single query
 * Automatically manages connection lifecycle
 */
export function useDatabaseQuery(pageId, componentId = null) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { getConnection, releaseConnection } = useDatabaseConnection(pageId, componentId);

    const executeQuery = async (query, params = []) => {
        setLoading(true);
        setError(null);
        
        try {
            const client = await getConnection();
            const result = await client.query(query, params);
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
        executeQuery,
        data,
        loading,
        error
    };
}

/**
 * Hook for components that need to execute multiple queries
 * Keeps connection open until explicitly released
 */
export function useDatabaseTransaction(pageId, componentId = null) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const { getConnection, releaseConnection } = useDatabaseConnection(pageId, componentId);

    const startTransaction = async () => {
        try {
            const client = await getConnection();
            await client.query('BEGIN');
            setIsConnected(true);
            return client;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const commitTransaction = async () => {
        try {
            if (connectionRef.current) {
                await connectionRef.current.query('COMMIT');
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
            if (connectionRef.current) {
                await connectionRef.current.query('ROLLBACK');
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

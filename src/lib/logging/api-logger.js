/**
 * API Logging Utility
 * Provides structured logging for API requests, responses, and errors
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * Log API request details
 * @param {string} requestId - Unique request identifier
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {string} description - Request description
 * @param {object} metadata - Additional metadata
 */
export function logAPIRequest(requestId, method, endpoint, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.INFO,
        requestId,
        type: 'API_REQUEST',
        method,
        endpoint,
        description,
        metadata
    };
    
    console.log(`[API-REQUEST] ${JSON.stringify(logEntry)}`);
}

/**
 * Log API success response
 * @param {string} requestId - Unique request identifier
 * @param {string} description - Success description
 * @param {object} metadata - Additional metadata
 */
export function logAPISuccess(requestId, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.INFO,
        requestId,
        type: 'API_SUCCESS',
        description,
        metadata
    };
    
    console.log(`[API-SUCCESS] ${JSON.stringify(logEntry)}`);
}

/**
 * Log API error
 * @param {string} requestId - Unique request identifier
 * @param {string} description - Error description
 * @param {object} metadata - Additional metadata
 */
export function logAPIError(requestId, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.ERROR,
        requestId,
        type: 'API_ERROR',
        description,
        metadata
    };
    
    console.error(`[API-ERROR] ${JSON.stringify(logEntry)}`);
}

/**
 * Log API warning
 * @param {string} requestId - Unique request identifier
 * @param {string} description - Warning description
 * @param {object} metadata - Additional metadata
 */
export function logAPIWarning(requestId, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.WARN,
        requestId,
        type: 'API_WARNING',
        description,
        metadata
    };
    
    console.warn(`[API-WARNING] ${JSON.stringify(logEntry)}`);
}

/**
 * Log API debug information
 * @param {string} requestId - Unique request identifier
 * @param {string} description - Debug description
 * @param {object} metadata - Additional metadata
 */
export function logAPIDebug(requestId, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.DEBUG,
        requestId,
        type: 'API_DEBUG',
        description,
        metadata
    };
    
    console.debug(`[API-DEBUG] ${JSON.stringify(logEntry)}`);
}

/**
 * Log performance metrics
 * @param {string} requestId - Unique request identifier
 * @param {string} endpoint - API endpoint
 * @param {number} duration - Request duration in milliseconds
 * @param {object} metadata - Additional metadata
 */
export function logAPIPerformance(requestId, endpoint, duration, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.INFO,
        requestId,
        type: 'API_PERFORMANCE',
        endpoint,
        duration,
        metadata
    };
    
    console.log(`[API-PERFORMANCE] ${JSON.stringify(logEntry)}`);
}

/**
 * Log database query performance
 * @param {string} requestId - Unique request identifier
 * @param {string} query - SQL query (truncated for security)
 * @param {number} duration - Query duration in milliseconds
 * @param {object} metadata - Additional metadata
 */
export function logDBQuery(requestId, query, duration, metadata = {}) {
    const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.DEBUG,
        requestId,
        type: 'DB_QUERY',
        query: truncatedQuery,
        duration,
        metadata
    };
    
    console.debug(`[DB-QUERY] ${JSON.stringify(logEntry)}`);
}

/**
 * Log security events
 * @param {string} requestId - Unique request identifier
 * @param {string} event - Security event type
 * @param {string} description - Event description
 * @param {object} metadata - Additional metadata
 */
export function logSecurityEvent(requestId, event, description, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.WARN,
        requestId,
        type: 'SECURITY_EVENT',
        event,
        description,
        metadata
    };
    
    console.warn(`[SECURITY] ${JSON.stringify(logEntry)}`);
}

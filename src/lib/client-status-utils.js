/**
 * Client-side status utilities
 * 
 * This module provides client-side functions for status operations
 * without importing server-side database modules.
 */

import { calculateApplicationStatus } from './application-status.js';

/**
 * Get the correct status for an application (always calculated)
 * @param {Object} application - Application object
 * @returns {string} - The correct status
 */
export function getCorrectStatus(application) {
    return calculateApplicationStatus(application);
}

/**
 * Check if an application's status needs synchronization
 * @param {Object} application - Application object
 * @returns {boolean} - True if status needs updating
 */
export function needsSynchronization(application) {
    const calculatedStatus = calculateApplicationStatus(application);
    const currentStatus = application.current_application_status || application.status;
    return currentStatus !== calculatedStatus;
}

/**
 * Check which applications need status updates via API
 * @returns {Promise<Object>} - Status update information
 */
export async function checkStatusUpdates() {
    try {
        const response = await fetch('/api/admin/synchronize-statuses', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking status updates:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Synchronize application statuses via API
 * @param {Array} applicationIds - Array of application IDs to synchronize
 * @returns {Promise<Object>} - Synchronization result
 */
export async function synchronizeStatuses(applicationIds = null) {
    try {
        const response = await fetch('/api/admin/synchronize-statuses', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: applicationIds ? JSON.stringify({ application_ids: applicationIds }) : '{}'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error synchronizing statuses:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get application status info for display
 * @param {Object} application - Application object
 * @returns {Object} - Status info with icon, label, and color
 */
export function getApplicationStatusInfo(application) {
    // Always use the correct calculated status - there should be only one status
    const correctStatus = getCorrectStatus(application);
    
    // Import getStatusInfo dynamically to avoid circular imports
    const { getStatusInfo } = require('./application-status.js');
    return getStatusInfo(correctStatus);
}

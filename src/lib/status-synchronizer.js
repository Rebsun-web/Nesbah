/**
 * Status Synchronizer
 * 
 * This module ensures that the database status is always synchronized with the calculated status
 * based on auction timing and offers. There should be only ONE status - the correct one.
 */

import pool from './db.js';
import { calculateApplicationStatus } from './application-status.js';

class StatusSynchronizer {
    /**
     * Synchronize the status of a single application
     * @param {Object} client - Database client
     * @param {number} applicationId - Application ID
     * @returns {Promise<Object>} - Synchronization result
     */
    static async synchronizeApplicationStatus(client, applicationId) {
        try {
            // Get current application data
            const appQuery = `
                SELECT 
                    application_id,
                    status,
                    current_application_status,
                    auction_end_time,
                    offers_count,
                    submitted_at
                FROM pos_application 
                WHERE application_id = $1
            `;
            
            const appResult = await client.query(appQuery, [applicationId]);
            
            if (appResult.rowCount === 0) {
                return {
                    success: false,
                    error: 'Application not found',
                    application_id: applicationId
                };
            }
            
            const application = appResult.rows[0];
            const calculatedStatus = calculateApplicationStatus(application);
            const currentStatus = application.current_application_status || application.status;
            
            // If status needs to be updated
            if (currentStatus !== calculatedStatus) {
                console.log(`🔄 Synchronizing application ${applicationId}: ${currentStatus} → ${calculatedStatus}`);
                
                // Update both status fields to the calculated status
                const updateQuery = `
                    UPDATE pos_application 
                    SET 
                        status = $1,
                        current_application_status = $1,
                        updated_at = NOW()
                    WHERE application_id = $2
                `;
                
                await client.query(updateQuery, [calculatedStatus, applicationId]);
                
                // Log the status correction
                try {
                    await client.query(`
                        INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                    `, [applicationId, currentStatus, calculatedStatus, 1, 'Automatic status synchronization']);
                } catch (logError) {
                    console.warn(`⚠️ Could not log status synchronization for application ${applicationId}:`, logError.message);
                }
                
                return {
                    success: true,
                    application_id: applicationId,
                    old_status: currentStatus,
                    new_status: calculatedStatus,
                    synchronized: true
                };
            }
            
            return {
                success: true,
                application_id: applicationId,
                status: calculatedStatus,
                synchronized: false
            };
            
        } catch (error) {
            console.error(`❌ Error synchronizing application ${applicationId}:`, error);
            return {
                success: false,
                error: error.message,
                application_id: applicationId
            };
        }
    }
    
    /**
     * Synchronize all applications that need status updates
     * @param {Object} client - Database client
     * @returns {Promise<Object>} - Synchronization summary
     */
    static async synchronizeAllApplicationStatuses(client) {
        try {
            console.log('🔄 Starting status synchronization for all applications...');
            
            // Validate client parameter
            if (!client) {
                throw new Error('Database client is required for status synchronization');
            }
            
            if (!client.query || typeof client.query !== 'function') {
                throw new Error('Invalid database client: query method not available');
            }
            
            // Get all applications that might need status updates
            const allAppsQuery = `
                SELECT 
                    application_id,
                    status,
                    current_application_status,
                    auction_end_time,
                    offers_count,
                    submitted_at
                FROM pos_application 
                WHERE status IN ('live_auction', 'completed', 'ignored')
                ORDER BY application_id
            `;
            
            const allAppsResult = await client.query(allAppsQuery);
            const applications = allAppsResult.rows;
            
            console.log(`📊 Found ${applications.length} applications to check`);
            
            let synchronized = 0;
            let errors = 0;
            const results = [];
            
            for (const app of applications) {
                const result = await this.synchronizeApplicationStatus(client, app.application_id);
                results.push(result);
                
                if (result.success) {
                    if (result.synchronized) {
                        synchronized++;
                    }
                } else {
                    errors++;
                }
            }
            
            console.log(`✅ Status synchronization completed: ${synchronized} synchronized, ${errors} errors`);
            
            return {
                success: true,
                total_checked: applications.length,
                synchronized,
                errors,
                results
            };
            
        } catch (error) {
            console.error('❌ Error in status synchronization:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get the correct status for an application (always calculated)
     * @param {Object} application - Application object
     * @returns {string} - The correct status
     */
    static getCorrectStatus(application) {
        return calculateApplicationStatus(application);
    }
    
    /**
     * Check if an application's status needs synchronization
     * @param {Object} application - Application object
     * @returns {boolean} - True if status needs updating
     */
    static needsSynchronization(application) {
        const calculatedStatus = calculateApplicationStatus(application);
        const currentStatus = application.current_application_status || application.status;
        return currentStatus !== calculatedStatus;
    }
}

export default StatusSynchronizer;

import pool from './db.js';

/**
 * Validates and corrects application status based on auction timing and offers
 * This function should be called whenever an application status is accessed
 * @param {number} applicationId - The application ID to validate
 * @param {string} currentStatus - The current status from database (optional, will fetch if not provided)
 * @returns {Promise<Object>} - Object containing validated status and whether it was corrected
 */
export async function validateApplicationStatus(applicationId, currentStatus = null) {
    const client = await pool.connectWithRetry(2, 1000, 'status-validation');
    
    try {
        // If current status not provided, fetch it
        if (!currentStatus) {
            const statusQuery = `
                SELECT status, auction_end_time, offers_count
                FROM pos_application 
                WHERE application_id = $1
            `;
            const statusResult = await client.query(statusQuery, [applicationId]);
            
            if (statusResult.rowCount === 0) {
                throw new Error(`Application ${applicationId} not found`);
            }
            
            currentStatus = statusResult.rows[0].status;
        }
        
        // Calculate the correct status
        const calculatedQuery = `
            SELECT 
                status,
                auction_end_time,
                offers_count,
                CASE 
                    WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                    WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                    ELSE 'live_auction'
                END as calculated_status
            FROM pos_application 
            WHERE application_id = $1
        `;
        
        const calculatedResult = await client.query(calculatedQuery, [applicationId]);
        
        if (calculatedResult.rowCount === 0) {
            throw new Error(`Application ${applicationId} not found for status calculation`);
        }
        
        const app = calculatedResult.rows[0];
        const calculatedStatus = app.calculated_status;
        
        // Check if status needs correction
        if (currentStatus !== calculatedStatus) {
            console.log(`🔄 Status inconsistency detected for application ${applicationId}:`);
            console.log(`   Current: ${currentStatus} → Calculated: ${calculatedStatus}`);
            console.log(`   Auction end: ${app.auction_end_time}, Offers: ${app.offers_count}`);
            
            // Update the status in the database
            await client.query(`
                UPDATE pos_application 
                SET status = $1,
                    current_application_status = $1,
                    updated_at = NOW()
                WHERE application_id = $2
            `, [calculatedStatus, applicationId]);
            
            // Log the status correction
            try {
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [applicationId, currentStatus, calculatedStatus, 1, 'Automatic status validation correction']);
            } catch (error) {
                console.log(`   ⚠️  Could not log status correction: ${error.message}`);
            }
            
            console.log(`   ✅ Status corrected from ${currentStatus} to ${calculatedStatus}`);
            
            return {
                status: calculatedStatus,
                wasCorrected: true,
                previousStatus: currentStatus,
                reason: 'Status automatically corrected based on auction timing and offers'
            };
        }
        
        // Status is already correct
        return {
            status: currentStatus,
            wasCorrected: false,
            previousStatus: currentStatus,
            reason: 'Status is already correct'
        };
        
    } finally {
        client.release();
    }
}

/**
 * Validates multiple application statuses at once
 * @param {Array<number>} applicationIds - Array of application IDs to validate
 * @returns {Promise<Array>} - Array of validation results
 */
export async function validateMultipleApplicationStatuses(applicationIds) {
    const results = [];
    
    for (const appId of applicationIds) {
        try {
            const result = await validateApplicationStatus(appId);
            results.push({ applicationId: appId, ...result });
        } catch (error) {
            results.push({ 
                applicationId: appId, 
                error: error.message,
                wasCorrected: false 
            });
        }
    }
    
    return results;
}

/**
 * Gets application status with automatic validation
 * This is the main function to use when you need an application status
 * @param {number} applicationId - The application ID
 * @returns {Promise<string>} - The validated status
 */
export async function getValidatedApplicationStatus(applicationId) {
    const result = await validateApplicationStatus(applicationId);
    return result.status;
}

/**
 * Batch validation for all applications in the system
 * Useful for periodic maintenance
 * @returns {Promise<Object>} - Summary of validation results
 */
export async function validateAllApplicationStatuses() {
    const client = await pool.connectWithRetry(2, 1000, 'status-validation');
    
    try {
        // Get all applications
        const allAppsQuery = `
            SELECT application_id, status
            FROM pos_application
        `;
        const allAppsResult = await client.query(allAppsQuery);
        
        const applicationIds = allAppsResult.rows.map(row => row.application_id);
        const results = await validateMultipleApplicationStatuses(applicationIds);
        
        const summary = {
            total: results.length,
            corrected: results.filter(r => r.wasCorrected).length,
            errors: results.filter(r => r.error).length,
            correct: results.filter(r => !r.wasCorrected && !r.error).length,
            details: results
        };
        
        console.log(`📊 Application Status Validation Summary:`);
        console.log(`   Total applications: ${summary.total}`);
        console.log(`   Statuses corrected: ${summary.corrected}`);
        console.log(`   Statuses already correct: ${summary.correct}`);
        console.log(`   Errors encountered: ${summary.errors}`);
        
        return summary;
        
    } finally {
        client.release();
    }
}

/**
 * Cascade Deletion Utility
 * 
 * This utility provides standardized cascade deletion for applications and their related records.
 * Ensures all related data is properly cleaned up when applications are deleted.
 */

/**
 * Deletes an application and all its related records in the correct order
 * @param {Object} client - Database client
 * @param {number} applicationId - Application ID to delete
 * @param {boolean} includeUserData - Whether to also delete user data (default: false)
 * @param {number} userId - User ID to delete if includeUserData is true
 * @returns {Promise<Object>} - Result object with success status and details
 */
export async function cascadeDeleteApplication(client, applicationId, includeUserData = false, userId = null) {
    try {
        console.log(`🗑️ Starting cascade deletion for application ${applicationId}...`);
        
        // Check if application exists first
        const checkQuery = `SELECT application_id FROM pos_application WHERE application_id = $1`;
        const checkResult = await client.query(checkQuery, [applicationId]);
        
        if (checkResult.rows.length === 0) {
            return {
                success: false,
                error: 'Application not found',
                deletedRecords: {}
            };
        }

        const deletedRecords = {
            application_offers: 0,
            bank_offer_submissions: 0,
            application_revenue: 0,
            status_audit_log: 0,
            application_offer_tracking: 0,
            bank_application_views: 0,
            pos_application: 0,
            business_users: 0,
            users: 0
        };

        // CASCADE DELETE: Delete related records first (in reverse order of dependencies)
        
        // 1. Delete application offers
        const offersResult = await client.query(
            `DELETE FROM application_offers WHERE submitted_application_id = $1`,
            [applicationId]
        );
        deletedRecords.application_offers = offersResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.application_offers} application offers`);

        // 2. Delete bank offer submissions
        const submissionsResult = await client.query(
            `DELETE FROM bank_offer_submissions WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.bank_offer_submissions = submissionsResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.bank_offer_submissions} bank offer submissions`);

        // 3. Delete application revenue
        const revenueResult = await client.query(
            `DELETE FROM application_revenue WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.application_revenue = revenueResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.application_revenue} application revenue records`);

        // 4. Delete status audit logs
        const auditResult = await client.query(
            `DELETE FROM status_audit_log WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.status_audit_log = auditResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.status_audit_log} status audit logs`);

        // 5. Delete application offer tracking
        const trackingResult = await client.query(
            `DELETE FROM application_offer_tracking WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.application_offer_tracking = trackingResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.application_offer_tracking} application offer tracking records`);

        // 6. Delete bank application views
        const viewsResult = await client.query(
            `DELETE FROM bank_application_views WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.bank_application_views = viewsResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.bank_application_views} bank application views`);

        // 7. Delete the main POS application
        const appResult = await client.query(
            `DELETE FROM pos_application WHERE application_id = $1`,
            [applicationId]
        );
        deletedRecords.pos_application = appResult.rowCount;
        console.log(`✅ Deleted ${deletedRecords.pos_application} POS application`);

        // 8. Optionally delete user data
        if (includeUserData && userId) {
            const businessResult = await client.query(
                `DELETE FROM business_users WHERE user_id = $1`,
                [userId]
            );
            deletedRecords.business_users = businessResult.rowCount;
            console.log(`✅ Deleted ${deletedRecords.business_users} business user`);

            const userResult = await client.query(
                `DELETE FROM users WHERE user_id = $1`,
                [userId]
            );
            deletedRecords.users = userResult.rowCount;
            console.log(`✅ Deleted ${deletedRecords.users} user`);
        }

        console.log(`✅ Cascade deletion completed for application ${applicationId}`);
        
        return {
            success: true,
            deletedRecords,
            totalRecordsDeleted: Object.values(deletedRecords).reduce((sum, count) => sum + count, 0)
        };

    } catch (error) {
        console.error(`❌ Error during cascade deletion for application ${applicationId}:`, error);
        throw error;
    }
}

/**
 * Deletes multiple applications and their related records
 * @param {Object} client - Database client
 * @param {Array<number>} applicationIds - Array of application IDs to delete
 * @returns {Promise<Object>} - Result object with success status and details
 */
export async function cascadeDeleteMultipleApplications(client, applicationIds) {
    try {
        console.log(`🗑️ Starting cascade deletion for ${applicationIds.length} applications...`);
        
        const results = {
            success: true,
            totalApplications: applicationIds.length,
            deletedRecords: {
                application_offers: 0,
                bank_offer_submissions: 0,
                application_revenue: 0,
                status_audit_log: 0,
                application_offer_tracking: 0,
                bank_application_views: 0,
                pos_application: 0
            },
            errors: []
        };

        // Use batch deletion for better performance
        if (applicationIds.length > 0) {
            // Delete application offers
            const offersResult = await client.query(
                `DELETE FROM application_offers WHERE submitted_application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.application_offers = offersResult.rowCount;

            // Delete bank offer submissions
            const submissionsResult = await client.query(
                `DELETE FROM bank_offer_submissions WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.bank_offer_submissions = submissionsResult.rowCount;

            // Delete application revenue
            const revenueResult = await client.query(
                `DELETE FROM application_revenue WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.application_revenue = revenueResult.rowCount;

            // Delete status audit logs
            const auditResult = await client.query(
                `DELETE FROM status_audit_log WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.status_audit_log = auditResult.rowCount;

            // Delete application offer tracking
            const trackingResult = await client.query(
                `DELETE FROM application_offer_tracking WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.application_offer_tracking = trackingResult.rowCount;

            // Delete bank application views
            const viewsResult = await client.query(
                `DELETE FROM bank_application_views WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.bank_application_views = viewsResult.rowCount;

            // Delete the main POS applications
            const appResult = await client.query(
                `DELETE FROM pos_application WHERE application_id = ANY($1)`,
                [applicationIds]
            );
            results.deletedRecords.pos_application = appResult.rowCount;
        }

        results.totalRecordsDeleted = Object.values(results.deletedRecords).reduce((sum, count) => sum + count, 0);
        
        console.log(`✅ Batch cascade deletion completed for ${applicationIds.length} applications`);
        console.log(`📊 Total records deleted: ${results.totalRecordsDeleted}`);
        
        return results;

    } catch (error) {
        console.error(`❌ Error during batch cascade deletion:`, error);
        throw error;
    }
}

/**
 * Validates that cascade deletion is properly implemented for a given application
 * @param {Object} client - Database client
 * @param {number} applicationId - Application ID to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateCascadeDeletion(client, applicationId) {
    try {
        console.log(`🔍 Validating cascade deletion for application ${applicationId}...`);
        
        const checks = {
            application_offers: 0,
            bank_offer_submissions: 0,
            application_revenue: 0,
            status_audit_log: 0,
            application_offer_tracking: 0,
            bank_application_views: 0,
            pos_application: 0
        };

        // Check each table for remaining records
        for (const table of Object.keys(checks)) {
            let query;
            if (table === 'application_offers') {
                query = `SELECT COUNT(*) as count FROM ${table} WHERE submitted_application_id = $1`;
            } else if (table === 'pos_application') {
                query = `SELECT COUNT(*) as count FROM ${table} WHERE application_id = $1`;
            } else {
                query = `SELECT COUNT(*) as count FROM ${table} WHERE application_id = $1`;
            }
            
            const result = await client.query(query, [applicationId]);
            checks[table] = parseInt(result.rows[0].count);
        }

        const hasRemainingRecords = Object.values(checks).some(count => count > 0);
        
        return {
            success: !hasRemainingRecords,
            checks,
            hasRemainingRecords,
            message: hasRemainingRecords 
                ? 'Some related records still exist - cascade deletion may be incomplete'
                : 'All related records properly deleted - cascade deletion successful'
        };

    } catch (error) {
        console.error(`❌ Error validating cascade deletion for application ${applicationId}:`, error);
        throw error;
    }
}

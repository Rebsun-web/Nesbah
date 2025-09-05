/**
 * Standardized Application Status Calculation
 * This module provides consistent status calculation across all components
 */

/**
 * Calculate the correct application status based on auction timing and offers
 * @param {Object} application - Application object with auction_end_time and offers_count
 * @param {string} application.auction_end_time - ISO string of auction end time
 * @param {number} application.offers_count - Number of offers received
 * @param {string} application.status - Current database status (fallback)
 * @returns {string} - Calculated status: 'live_auction', 'completed', or 'ignored'
 */
export function calculateApplicationStatus(application) {
    const { auction_end_time, offers_count, status } = application;
    
    // If no auction end time, return the database status
    if (!auction_end_time) {
        return status || 'live_auction';
    }
    
    const now = new Date();
    const auctionEnd = new Date(auction_end_time);
    const timeRemaining = auctionEnd.getTime() - now.getTime();
    
    // If auction has ended
    if (timeRemaining <= 0) {
        // If there are offers, it's completed
        if (offers_count > 0) {
            return 'completed';
        }
        // If no offers, it's ignored
        return 'ignored';
    }
    
    // If auction is still active, it's live
    return 'live_auction';
}

/**
 * Get status information for display purposes
 * @param {string} status - The calculated status
 * @returns {Object} - Status display information
 */
export function getStatusInfo(status) {
    switch (status) {
        case 'live_auction':
            return {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                borderColor: 'border-yellow-200',
                icon: '⏰',
                description: 'Application is currently in live auction'
            };
        case 'completed':
            return {
                label: 'Completed',
                color: 'bg-green-100 text-green-800',
                borderColor: 'border-green-200',
                icon: '✅',
                description: 'Application has offers and auction completed'
            };
        case 'ignored':
            return {
                label: 'Ignored',
                color: 'bg-red-100 text-red-800',
                borderColor: 'border-red-200',
                icon: '❌',
                description: 'Application expired with no offers'
            };
        default:
            return {
                label: 'Unknown',
                color: 'bg-gray-100 text-gray-800',
                borderColor: 'border-gray-200',
                icon: '❓',
                description: 'Status unknown'
            };
    }
}

/**
 * Format countdown time for auction
 * @param {string} auctionEndTime - ISO string of auction end time
 * @returns {string} - Formatted countdown string
 */
export function formatCountdown(auctionEndTime) {
    if (!auctionEndTime) return 'N/A';
    
    const endTime = new Date(auctionEndTime);
    const now = new Date();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
        return 'Auction finished';
    } else {
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return `${hoursLeft}h ${minutesLeft}m left`;
    }
}

/**
 * SQL query fragment for calculating status in database queries
 * This should be used in all database queries that need status calculation
 * Note: This calculates the CORRECT status based on auction timing and offers
 */
export const STATUS_CALCULATION_SQL = `
    CASE 
        WHEN pa.auction_end_time < NOW() AND pa.offers_count > 0 THEN 'completed'
        WHEN pa.auction_end_time < NOW() AND pa.offers_count = 0 THEN 'ignored'
        ELSE 'live_auction'
    END as calculated_status
`;

/**
 * SQL query fragment for filtering by status in database queries
 * This should be used when filtering applications by status
 */
export const STATUS_FILTER_SQL = `
    CASE 
        WHEN pa.auction_end_time < NOW() AND pa.offers_count > 0 THEN 'completed'
        WHEN pa.auction_end_time < NOW() AND pa.offers_count = 0 THEN 'ignored'
        ELSE 'live_auction'
    END
`;

/**
 * Validate and correct application status in database
 * @param {Object} client - Database client
 * @param {number} applicationId - Application ID
 * @returns {Promise<Object>} - Updated status information
 */
export async function validateAndCorrectStatus(client, applicationId) {
    // Get current application data
    const appQuery = `
        SELECT 
            application_id,
            status,
            auction_end_time,
            offers_count,
            ${STATUS_CALCULATION_SQL}
        FROM pos_application 
        WHERE application_id = $1
    `;
    
    const appResult = await client.query(appQuery, [applicationId]);
    
    if (appResult.rowCount === 0) {
        throw new Error(`Application ${applicationId} not found`);
    }
    
    const application = appResult.rows[0];
    const calculatedStatus = application.calculated_status;
    
    // If status needs correction, update it
    if (application.status !== calculatedStatus) {
        const updateQuery = `
            UPDATE pos_application 
            SET status = $1, updated_at = NOW()
            WHERE application_id = $2
        `;
        
        await client.query(updateQuery, [calculatedStatus, applicationId]);
        
        return {
            application_id: applicationId,
            old_status: application.status,
            new_status: calculatedStatus,
            corrected: true
        };
    }
    
    return {
        application_id: applicationId,
        status: calculatedStatus,
        corrected: false
    };
}

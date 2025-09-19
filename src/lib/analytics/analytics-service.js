/**
 * Analytics Service
 * 
 * This module provides analytics tracking functionality for the application.
 */

import pool from '../db.js';

class AnalyticsService {
    /**
     * Track application view
     * @param {number} applicationId - Application ID
     * @param {number} bankUserId - Bank user ID
     */
    static async trackApplicationView(applicationId, bankUserId) {
        try {
            await pool.query(
                `INSERT INTO analytics_events (event_type, application_id, bank_user_id, timestamp)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT DO NOTHING`,
                ['application_view', applicationId, bankUserId]
            );
        } catch (error) {
            console.error('Failed to track application view:', error);
            // Don't throw - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Track offer submission
     * @param {number} applicationId - Application ID
     * @param {number} bankUserId - Bank user ID
     * @param {number} offerId - Offer ID
     */
    static async trackOfferSubmission(applicationId, bankUserId, offerId) {
        try {
            await pool.query(
                `INSERT INTO analytics_events (event_type, application_id, bank_user_id, offer_id, timestamp)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT DO NOTHING`,
                ['offer_submission', applicationId, bankUserId, offerId]
            );
        } catch (error) {
            console.error('Failed to track offer submission:', error);
            // Don't throw - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Track lead purchase
     * @param {number} applicationId - Application ID
     * @param {number} bankUserId - Bank user ID
     */
    static async trackLeadPurchase(applicationId, bankUserId) {
        try {
            await pool.query(
                `INSERT INTO analytics_events (event_type, application_id, bank_user_id, timestamp)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT DO NOTHING`,
                ['lead_purchase', applicationId, bankUserId]
            );
        } catch (error) {
            console.error('Failed to track lead purchase:', error);
            // Don't throw - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Get analytics data for an application
     * @param {number} applicationId - Application ID
     * @returns {Promise<Object>} - Analytics data
     */
    static async getApplicationAnalytics(applicationId) {
        try {
            const result = await pool.query(
                `SELECT 
                    event_type,
                    COUNT(*) as count,
                    COUNT(DISTINCT bank_user_id) as unique_banks
                 FROM analytics_events 
                 WHERE application_id = $1
                 GROUP BY event_type`,
                [applicationId]
            );

            const analytics = {};
            result.rows.forEach(row => {
                analytics[row.event_type] = {
                    count: parseInt(row.count),
                    unique_banks: parseInt(row.unique_banks)
                };
            });

            return analytics;
        } catch (error) {
            console.error('Failed to get application analytics:', error);
            return {};
        }
    }

    /**
     * Get analytics data for a bank user
     * @param {number} bankUserId - Bank user ID
     * @returns {Promise<Object>} - Analytics data
     */
    static async getBankAnalytics(bankUserId) {
        try {
            const result = await pool.query(
                `SELECT 
                    event_type,
                    COUNT(*) as count,
                    COUNT(DISTINCT application_id) as unique_applications
                 FROM analytics_events 
                 WHERE bank_user_id = $1
                 GROUP BY event_type`,
                [bankUserId]
            );

            const analytics = {};
            result.rows.forEach(row => {
                analytics[row.event_type] = {
                    count: parseInt(row.count),
                    unique_applications: parseInt(row.unique_applications)
                };
            });

            return analytics;
        } catch (error) {
            console.error('Failed to get bank analytics:', error);
            return {};
        }
    }
}

export { AnalyticsService };

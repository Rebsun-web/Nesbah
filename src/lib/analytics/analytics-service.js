import pool from '@/lib/db';

export class AnalyticsService {
    /**
     * Track when a bank views an application
     */
    static async trackApplicationView(applicationId, bankUserId) {
        const client = await pool.connectWithRetry();
        try {
            // Get auction start time for the application
            const appQuery = await client.query(
                `SELECT auction_end_time FROM submitted_applications WHERE application_id = $1`,
                [applicationId]
            );
            
            if (appQuery.rows.length === 0) {
                throw new Error('Application not found');
            }
            
            const auctionEndTime = appQuery.rows[0].auction_end_time;
            const auctionStartTime = new Date(auctionEndTime.getTime() - (48 * 60 * 60 * 1000)); // 48 hours before
            const timeToOpenMinutes = (Date.now() - auctionStartTime.getTime()) / (1000 * 60);
            
            // Insert or update the view record
            await client.query(`
                INSERT INTO bank_application_views (application_id, bank_user_id, auction_start_time, time_to_open_minutes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (application_id, bank_user_id) 
                DO UPDATE SET 
                    viewed_at = NOW(),
                    time_to_open_minutes = LEAST(bank_application_views.time_to_open_minutes, $4)
            `, [applicationId, bankUserId, auctionStartTime, timeToOpenMinutes]);
            
        } finally {
            client.release();
        }
    }

    /**
     * Track when a bank submits an offer
     */
    static async trackOfferSubmission(applicationId, bankUserId, offerId) {
        const client = await pool.connectWithRetry();
        try {
            // Get the first view time for this bank and application
            const viewQuery = await client.query(
                `SELECT viewed_at FROM bank_application_views 
                 WHERE application_id = $1 AND bank_user_id = $2`,
                [applicationId, bankUserId]
            );
            
            let firstViewedAt = null;
            let timeToSubmitMinutes = 0;
            
            if (viewQuery.rows.length > 0) {
                firstViewedAt = viewQuery.rows[0].viewed_at;
                timeToSubmitMinutes = (Date.now() - firstViewedAt.getTime()) / (1000 * 60);
            }
            
            // Insert the offer submission record
            await client.query(`
                INSERT INTO bank_offer_submissions (application_id, bank_user_id, offer_id, first_viewed_at, time_to_submit_minutes)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (application_id, bank_user_id, offer_id) 
                DO UPDATE SET 
                    submitted_at = NOW(),
                    time_to_submit_minutes = LEAST(bank_offer_submissions.time_to_submit_minutes, $5)
            `, [applicationId, bankUserId, offerId, firstViewedAt, timeToSubmitMinutes]);
            
        } finally {
            client.release();
        }
    }

    /**
     * Calculate and store daily metrics for a specific bank
     */
    static async calculateBankMetrics(bankUserId, date = new Date()) {
        const client = await pool.connectWithRetry();
        try {
            const dateStr = date.toISOString().split('T')[0];
            
            // Get bank name
            const bankQuery = await client.query(
                `SELECT entity_name FROM users WHERE user_id = $1`,
                [bankUserId]
            );
            const bankName = bankQuery.rows[0]?.entity_name || 'Unknown Bank';
            
            // Calculate metrics for the day
            const metricsQuery = await client.query(`
                SELECT 
                    COUNT(DISTINCT bav.application_id) as total_applications_viewed,
                    COUNT(DISTINCT bos.application_id) as total_offers_submitted,
                    AVG(bav.time_to_open_minutes) as avg_time_to_open_minutes,
                    AVG(bos.time_to_submit_minutes) as avg_time_to_submit_minutes,
                    COALESCE(
                        CASE 
                            WHEN COUNT(DISTINCT bav.application_id) > 0 
                            THEN COUNT(DISTINCT bos.application_id)::DECIMAL / COUNT(DISTINCT bav.application_id)::DECIMAL
                            ELSE 0 
                        END, 0
                    ) as conversion_rate,
                    COALESCE(SUM(ao.offer_amount), 0) as total_revenue_generated
                FROM bank_application_views bav
                LEFT JOIN bank_offer_submissions bos ON bav.application_id = bos.application_id AND bav.bank_user_id = bos.bank_user_id
                LEFT JOIN application_offers ao ON bos.offer_id = ao.offer_id
                WHERE bav.bank_user_id = $1 
                AND DATE(bav.viewed_at) = $2
            `, [bankUserId, dateStr]);
            
            const metrics = metricsQuery.rows[0];
            
            // Insert or update the metrics
            await client.query(`
                INSERT INTO time_metrics (
                    bank_user_id, bank_name, metric_date, 
                    total_applications_viewed, total_offers_submitted,
                    avg_time_to_open_minutes, avg_time_to_submit_minutes,
                    conversion_rate, total_revenue_generated,
                    applications_per_day, offers_per_day,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (bank_user_id, metric_date) 
                DO UPDATE SET 
                    total_applications_viewed = $4,
                    total_offers_submitted = $5,
                    avg_time_to_open_minutes = $6,
                    avg_time_to_submit_minutes = $7,
                    conversion_rate = $8,
                    total_revenue_generated = $9,
                    applications_per_day = $10,
                    offers_per_day = $11,
                    updated_at = NOW()
            `, [
                bankUserId, bankName, dateStr,
                metrics.total_applications_viewed || 0,
                metrics.total_offers_submitted || 0,
                metrics.avg_time_to_open_minutes || 0,
                metrics.avg_time_to_submit_minutes || 0,
                metrics.conversion_rate || 0,
                metrics.total_revenue_generated || 0,
                metrics.total_applications_viewed || 0,
                metrics.total_offers_submitted || 0
            ]);
            
        } finally {
            client.release();
        }
    }

    /**
     * Calculate and store overall application conversion metrics
     */
    static async calculateOverallMetrics(date = new Date()) {
        const client = await pool.connectWithRetry();
        try {
            const dateStr = date.toISOString().split('T')[0];
            
            // Calculate overall metrics for the day
            const metricsQuery = await client.query(`
                SELECT 
                    COUNT(DISTINCT sa.application_id) as total_applications,
                    COUNT(DISTINCT bav.application_id) as total_applications_viewed,
                    COUNT(DISTINCT bos.application_id) as total_offers_submitted,
                    COUNT(DISTINCT CASE WHEN sa.status = 'completed' THEN sa.application_id END) as total_applications_purchased,
                    AVG(bav.time_to_open_minutes) as avg_time_to_first_offer_minutes,
                    COALESCE(SUM(ao.offer_amount), 0) as total_revenue
                FROM submitted_applications sa
                LEFT JOIN bank_application_views bav ON sa.application_id = bav.application_id
                LEFT JOIN bank_offer_submissions bos ON sa.application_id = bos.application_id
                LEFT JOIN application_offers ao ON bos.offer_id = ao.offer_id
                WHERE DATE(sa.submitted_at) = $1
            `, [dateStr]);
            
            const metrics = metricsQuery.rows[0];
            
            // Calculate conversion rates
            const viewToOfferRate = metrics.total_applications_viewed > 0 
                ? (metrics.total_offers_submitted / metrics.total_applications_viewed) 
                : 0;
            
            const offerToPurchaseRate = metrics.total_offers_submitted > 0 
                ? (metrics.total_applications_purchased / metrics.total_offers_submitted) 
                : 0;
            
            const overallRate = metrics.total_applications > 0 
                ? (metrics.total_applications_completed / metrics.total_applications) 
                : 0;
            
            // Insert or update the metrics
            await client.query(`
                INSERT INTO application_conversion_metrics (
                    metric_date, total_applications, total_applications_viewed,
                    total_offers_submitted, total_applications_purchased, total_applications_completed,
                    view_to_offer_conversion_rate, offer_to_purchase_conversion_rate, overall_conversion_rate,
                    avg_time_to_first_offer_minutes, total_revenue, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (metric_date) 
                DO UPDATE SET 
                    total_applications = $2,
                    total_applications_viewed = $3,
                    total_offers_submitted = $4,
                    total_applications_purchased = $5,
                    total_applications_completed = $6,
                    view_to_offer_conversion_rate = $7,
                    offer_to_purchase_conversion_rate = $8,
                    overall_conversion_rate = $9,
                    avg_time_to_first_offer_minutes = $10,
                    total_revenue = $11,
                    updated_at = NOW()
            `, [
                dateStr,
                metrics.total_applications || 0,
                metrics.total_applications_viewed || 0,
                metrics.total_offers_submitted || 0,
                metrics.total_applications_purchased || 0,
                metrics.total_applications_completed || 0,
                viewToOfferRate,
                offerToPurchaseRate,
                overallRate,
                metrics.avg_time_to_first_offer_minutes || 0,
                metrics.total_revenue || 0
            ]);
            
        } finally {
            client.release();
        }
    }

    /**
     * Clean up temporary tracking data when auction ends
     */
    static async cleanupAuctionData(applicationId) {
        const client = await pool.connectWithRetry();
        try {
            // Delete tracking data for the completed auction
            await client.query(
                `DELETE FROM bank_application_views WHERE application_id = $1`,
                [applicationId]
            );
            
            await client.query(
                `DELETE FROM bank_offer_submissions WHERE application_id = $1`,
                [applicationId]
            );
            
        } finally {
            client.release();
        }
    }

    /**
     * Get bank metrics for a specific date range
     */
    static async getBankMetrics(bankUserId, startDate, endDate) {
        const client = await pool.connectWithRetry();
        try {
            const result = await client.query(`
                SELECT * FROM time_metrics 
                WHERE bank_user_id = $1 
                AND metric_date BETWEEN $2 AND $3
                ORDER BY metric_date DESC
            `, [bankUserId, startDate, endDate]);
            
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Get overall conversion metrics for a date range
     */
    static async getOverallMetrics(startDate, endDate) {
        const client = await pool.connectWithRetry();
        try {
            const result = await client.query(`
                SELECT * FROM application_conversion_metrics 
                WHERE metric_date BETWEEN $1 AND $2
                ORDER BY metric_date DESC
            `, [startDate, endDate]);
            
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Get top performing banks by conversion rate
     */
    static async getTopPerformingBanks(limit = 10, date = new Date()) {
        const client = await pool.connectWithRetry();
        try {
            const dateStr = date.toISOString().split('T')[0];
            
            const result = await client.query(`
                SELECT 
                    tm.bank_user_id,
                    tm.bank_name,
                    tm.conversion_rate,
                    tm.total_applications_viewed,
                    tm.total_offers_submitted,
                    tm.avg_time_to_open_minutes,
                    tm.avg_time_to_submit_minutes,
                    tm.total_revenue_generated
                FROM time_metrics tm
                WHERE tm.metric_date = $1
                AND tm.total_applications_viewed > 0
                ORDER BY tm.conversion_rate DESC, tm.total_offers_submitted DESC
                LIMIT $2
            `, [dateStr, limit]);
            
            return result.rows;
        } finally {
            client.release();
        }
    }
}

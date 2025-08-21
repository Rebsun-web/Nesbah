import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        try {
            // Get offer counts by status using tracking table
            const offerStatusStats = await client.query(`
                SELECT 
                    current_offer_status as status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN offer_sent_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
                FROM application_offer_tracking
                WHERE offer_id IS NOT NULL
                GROUP BY current_offer_status
                ORDER BY count DESC
            `);

            // Get offers by bank using tracking table
            const bankOfferStats = await client.query(`
                SELECT 
                    COALESCE(u.entity_name, 'Unknown Bank') as bank_name,
                    aot.bank_user_id,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'submitted' THEN 1 END) as pending_offers,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN aot.current_offer_status = 'deal_won' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                            ELSE 0 
                        END, 2
                    ) as win_rate
                FROM application_offer_tracking aot
                LEFT JOIN users u ON aot.bank_user_id = u.user_id
                WHERE aot.offer_id IS NOT NULL
                GROUP BY aot.bank_user_id, u.entity_name
                ORDER BY total_offers DESC
                LIMIT 10
            `);

            // Get offers by business using tracking table
            const businessOfferStats = await client.query(`
                SELECT 
                    pa.trade_name as business_name,
                    aot.application_id,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN aot.current_offer_status = 'submitted' THEN 1 END) as pending_offers,
                    MAX(aot.offer_sent_at) as last_offer_date
                FROM application_offer_tracking aot
                JOIN pos_application pa ON aot.application_id = pa.application_id
                WHERE aot.offer_id IS NOT NULL
                GROUP BY aot.application_id, pa.trade_name
                ORDER BY total_offers DESC
                LIMIT 10
            `);

            // Get offer submission trends (last 12 months)
            const offerTrends = await client.query(`
                SELECT 
                    DATE_TRUNC('month', offer_sent_at) as month,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN current_offer_status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN current_offer_status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN current_offer_status = 'submitted' THEN 1 END) as pending_offers
                FROM application_offer_tracking
                WHERE offer_sent_at >= NOW() - INTERVAL '12 months'
                AND offer_id IS NOT NULL
                GROUP BY DATE_TRUNC('month', offer_sent_at)
                ORDER BY month
            `);

            // Get offer processing time (submission to acceptance)
            const offerProcessingTime = await client.query(`
                SELECT 
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_sent_at)) / 3600
                    ), 2) as avg_offer_processing_hours,
                    ROUND(MIN(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_sent_at)) / 3600
                    ), 2) as min_offer_processing_hours,
                    ROUND(MAX(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_sent_at)) / 3600
                    ), 2) as max_offer_processing_hours,
                    COUNT(*) as total_accepted_offers
                FROM application_offer_tracking
                WHERE current_offer_status = 'deal_won'
                AND offer_sent_at IS NOT NULL
                AND offer_accepted_at IS NOT NULL
            `);

            // Get bank response time (purchase to offer submission)
            const bankResponseTime = await client.query(`
                SELECT 
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                    ), 2) as avg_bank_response_hours,
                    ROUND(MIN(
                        EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                    ), 2) as min_bank_response_hours,
                    ROUND(MAX(
                        EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                    ), 2) as max_bank_response_hours,
                    COUNT(*) as total_bank_responses
                FROM application_offer_tracking
                WHERE offer_sent_at IS NOT NULL
                AND purchased_at IS NOT NULL
            `);

            // Get user acceptance time (offer window start to offer acceptance)
            const userAcceptanceTime = await client.query(`
                SELECT 
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_window_start)) / 3600
                    ), 2) as avg_user_acceptance_hours,
                    ROUND(MIN(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_window_start)) / 3600
                    ), 2) as min_user_acceptance_hours,
                    ROUND(MAX(
                        EXTRACT(EPOCH FROM (offer_accepted_at - offer_window_start)) / 3600
                    ), 2) as max_user_acceptance_hours,
                    COUNT(*) as total_user_acceptances
                FROM application_offer_tracking
                WHERE offer_accepted_at IS NOT NULL
                AND offer_window_start IS NOT NULL
            `);

            // Get offer selection window times
            const offerWindowTimes = await client.query(`
                SELECT 
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                    ), 2) as avg_offer_window_hours,
                    ROUND(MIN(
                        EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                    ), 2) as min_offer_window_hours,
                    ROUND(MAX(
                        EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                    ), 2) as max_offer_window_hours,
                    COUNT(*) as total_offer_windows
                FROM application_offer_tracking
                WHERE offer_window_start IS NOT NULL
                AND offer_window_end IS NOT NULL
            `);

            // Get average offer metrics (from application_offers table)
            const averageMetrics = await client.query(`
                SELECT 
                    ROUND(AVG(CASE WHEN ao.offer_device_setup_fee IS NOT NULL THEN ao.offer_device_setup_fee END), 2) as avg_setup_fee,
                    ROUND(AVG(CASE WHEN ao.offer_transaction_fee_mada IS NOT NULL THEN ao.offer_transaction_fee_mada END), 2) as avg_mada_fee,
                    ROUND(AVG(CASE WHEN ao.offer_transaction_fee_visa_mc IS NOT NULL THEN ao.offer_transaction_fee_visa_mc END), 2) as avg_visa_mc_fee,
                    ROUND(AVG(CASE WHEN ao.offer_settlement_time_mada IS NOT NULL THEN ao.offer_settlement_time_mada END), 2) as avg_settlement_time,
                    COUNT(CASE WHEN ao.offer_device_setup_fee IS NOT NULL THEN 1 END) as offers_with_setup_fee,
                    COUNT(CASE WHEN ao.offer_transaction_fee_mada IS NOT NULL THEN 1 END) as offers_with_mada_fee,
                    COUNT(CASE WHEN ao.offer_transaction_fee_visa_mc IS NOT NULL THEN 1 END) as offers_with_visa_mc_fee,
                    COUNT(CASE WHEN ao.offer_settlement_time_mada IS NOT NULL THEN 1 END) as offers_with_settlement_time
                FROM application_offers ao
                JOIN application_offer_tracking aot ON ao.offer_id = aot.offer_id
                WHERE ao.status IN ('deal_won', 'deal_lost', 'submitted')
            `);

            // Get recent offer activity (last 7 days)
            const recentActivity = await client.query(`
                SELECT 
                    aot.offer_id,
                    aot.current_offer_status as status,
                    aot.offer_sent_at as submitted_at,
                    pa.trade_name as business_name,
                    COALESCE(u.entity_name, 'Unknown Bank') as bank_name,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada
                FROM application_offer_tracking aot
                JOIN application_offers ao ON aot.offer_id = ao.offer_id
                JOIN pos_application pa ON aot.application_id = pa.application_id
                LEFT JOIN users u ON aot.bank_user_id = u.user_id
                WHERE aot.offer_sent_at >= NOW() - INTERVAL '7 days'
                ORDER BY aot.offer_sent_at DESC
                LIMIT 20
            `);

            // Get featured offers
            const featuredOffers = await client.query(`
                SELECT 
                    aot.offer_id,
                    ao.is_featured,
                    ao.featured_reason,
                    aot.offer_sent_at as submitted_at,
                    pa.trade_name as business_name,
                    COALESCE(u.entity_name, 'Unknown Bank') as bank_name,
                    aot.current_offer_status as status
                FROM application_offer_tracking aot
                JOIN application_offers ao ON aot.offer_id = ao.offer_id
                JOIN pos_application pa ON aot.application_id = pa.application_id
                LEFT JOIN users u ON aot.bank_user_id = u.user_id
                WHERE ao.is_featured = true
                ORDER BY aot.offer_sent_at DESC
                LIMIT 10
            `);

            // Calculate summary statistics
            const totalOffers = offerStatusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalWonOffers = offerStatusStats.rows.find(row => row.status === 'deal_won')?.count || 0;
            const totalLostOffers = offerStatusStats.rows.find(row => row.status === 'deal_lost')?.count || 0;
            const totalPendingOffers = offerStatusStats.rows.find(row => row.status === 'submitted')?.count || 0;
            const overallWinRate = totalOffers > 0 ? Math.round((totalWonOffers / totalOffers) * 100) : 0;

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_offers: totalOffers,
                        total_won_offers: totalWonOffers,
                        total_lost_offers: totalLostOffers,
                        total_pending_offers: totalPendingOffers,
                        overall_win_rate: overallWinRate,
                        recent_offers: offerStatusStats.rows.reduce((sum, row) => sum + parseInt(row.recent_count), 0)
                    },
                    by_status: offerStatusStats.rows,
                    by_bank: bankOfferStats.rows,
                    by_business: businessOfferStats.rows,
                    trends: offerTrends.rows,
                    average_metrics: averageMetrics.rows[0] || {},
                    offer_processing_time: offerProcessingTime.rows[0] || {},
                    bank_response_time: bankResponseTime.rows[0] || {},
                    user_acceptance_time: userAcceptanceTime.rows[0] || {},
                    offer_window_times: offerWindowTimes.rows[0] || {},
                    recent_activity: recentActivity.rows,
                    featured_offers: featuredOffers.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Offer analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offer analytics' },
            { status: 500 }
        );
    }
}

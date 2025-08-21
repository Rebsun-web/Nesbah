import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        try {
            // Get offer counts by status
            const offerStatusStats = await client.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
                FROM application_offers
                GROUP BY status
                ORDER BY count DESC
            `);

            // Get offers by bank
            const bankOfferStats = await client.query(`
                SELECT 
                    COALESCE(bu.entity_name, 'Unknown Bank') as bank_name,
                    COALESCE(bu.user_id, 0) as bank_user_id,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN ao.status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN ao.status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END) as pending_offers,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN ao.status = 'deal_won' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                            ELSE 0 
                        END, 2
                    ) as win_rate
                FROM application_offers ao
                LEFT JOIN bank_users bu ON ao.submitted_by_user_id = bu.user_id
                GROUP BY bu.user_id, bu.entity_name
                ORDER BY total_offers DESC
                LIMIT 10
            `);

            // Get offers by business
            const businessOfferStats = await client.query(`
                SELECT 
                    pa.trade_name as business_name,
                    pa.application_id,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN ao.status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN ao.status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END) as pending_offers,
                    MAX(ao.submitted_at) as last_offer_date
                FROM application_offers ao
                JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                JOIN pos_application pa ON sa.application_id = pa.application_id
                GROUP BY pa.application_id, pa.trade_name
                ORDER BY total_offers DESC
                LIMIT 10
            `);

            // Get offer submission trends (last 12 months)
            const offerTrends = await client.query(`
                SELECT 
                    DATE_TRUNC('month', submitted_at) as month,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN status = 'deal_won' THEN 1 END) as won_offers,
                    COUNT(CASE WHEN status = 'deal_lost' THEN 1 END) as lost_offers,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_offers
                FROM application_offers
                WHERE submitted_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', submitted_at)
                ORDER BY month
            `);

            // Get average offer metrics
            const averageMetrics = await client.query(`
                SELECT 
                    ROUND(AVG(offer_device_setup_fee), 2) as avg_setup_fee,
                    ROUND(AVG(offer_transaction_fee_mada), 2) as avg_mada_fee,
                    ROUND(AVG(offer_transaction_fee_visa_mc), 2) as avg_visa_mc_fee,
                    ROUND(AVG(offer_settlement_time_mada), 2) as avg_settlement_time
                FROM application_offers
                WHERE offer_device_setup_fee IS NOT NULL 
                   OR offer_transaction_fee_mada IS NOT NULL 
                   OR offer_transaction_fee_visa_mc IS NOT NULL
            `);

            // Get recent offer activity (last 7 days)
            const recentActivity = await client.query(`
                SELECT 
                    ao.id as offer_id,
                    ao.status,
                    ao.submitted_at,
                    pa.trade_name as business_name,
                    COALESCE(bu.entity_name, 'Unknown Bank') as bank_name,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada
                FROM application_offers ao
                JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                JOIN pos_application pa ON sa.application_id = pa.application_id
                LEFT JOIN bank_users bu ON ao.submitted_by_user_id = bu.user_id
                WHERE ao.submitted_at >= NOW() - INTERVAL '7 days'
                ORDER BY ao.submitted_at DESC
                LIMIT 20
            `);

            // Get featured offers
            const featuredOffers = await client.query(`
                SELECT 
                    ao.id as offer_id,
                    ao.is_featured,
                    ao.featured_reason,
                    ao.submitted_at,
                    pa.trade_name as business_name,
                    COALESCE(bu.entity_name, 'Unknown Bank') as bank_name,
                    ao.status
                FROM application_offers ao
                JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                JOIN pos_application pa ON sa.application_id = pa.application_id
                LEFT JOIN bank_users bu ON ao.submitted_by_user_id = bu.user_id
                WHERE ao.is_featured = true
                ORDER BY ao.submitted_at DESC
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

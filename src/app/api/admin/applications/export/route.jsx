import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';
import AdminAuth from '@/lib/auth/admin-auth';
import { STATUS_CALCULATION_SQL, STATUS_FILTER_SQL } from '@/lib/application-status';
import {
    formatFinancingType,
    formatAmountRange,
    formatAgeRange,
    formatRevenueRange,
    formatCity,
    formatSector,
    formatHasPos,
} from '@/lib/apply-options';
import { TIER_LABELS } from '@/lib/lead-score';

// GET - Export the application record for every application (respecting the
// same search/status/financing_type filters as the list view) as an .xlsx file.
// Column set matches the client's "Admin Application Export" spec exactly.
export async function GET(req) {
    try {
        const adminToken = req.cookies.get('admin_token')?.value;
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        if (!sessionValidation.valid) {
            return NextResponse.json({
                success: false,
                error: sessionValidation.error || 'Invalid admin session'
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const financingType = searchParams.get('financing_type') || 'all';

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_export_route.jsx_route');

        try {
            // Build WHERE clause (identical semantics to the list route).
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                whereConditions.push(`(wd.trade_name ILIKE $${paramCount} OR pa.application_id::text ILIKE $${paramCount} OR wd.cr_number ILIKE $${paramCount} OR pa.cr_national_number ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }
            if (status !== 'all') {
                paramCount++;
                whereConditions.push(`(${STATUS_FILTER_SQL}) = $${paramCount}`);
                queryParams.push(status);
            }
            if (financingType !== 'all') {
                paramCount++;
                whereConditions.push(`pa.financing_type = $${paramCount}`);
                queryParams.push(financingType);
            }
            const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

            const query = `
                SELECT
                    pa.application_id,
                    pa.status,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.financing_type,
                    pa.requested_financing_amount,
                    pa.approximate_financing_amount,
                    pa.amount_range_code,
                    pa.business_age_range_code,
                    pa.annual_revenue_code,
                    pa.is_pre_revenue,
                    pa.own_pos_system,
                    pa.lead_score,
                    pa.lead_tier,
                    pa.city_code,
                    pa.sector_code,
                    pa.consent_at,
                    pa.consent_version,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.cr_national_number,
                    COALESCE(pa.business_contact_email, u.email) as email,
                    COALESCE(pa.city_of_operation, wd.city) as city,
                    COALESCE(pa.sector, wd.sector) as sector,
                    pa.notes,
                    pa.admin_notes,
                    pa.uploaded_filename,
                    -- Wathiq / business registry data
                    wd.trade_name,
                    wd.cr_number,
                    wd.legal_form,
                    wd.registration_status,
                    wd.issue_date_gregorian,
                    wd.confirmation_date_gregorian,
                    -- Calculated (live) auction status, alongside the raw stored status
                    ${STATUS_CALCULATION_SQL},
                    -- Views
                    COALESCE(array_length(pa.opened_by, 1), 0) as opened_count
                FROM pos_application pa
                LEFT JOIN wathiq_data wd ON wd.cr_national_number = pa.cr_national_number
                LEFT JOIN users u ON pa.user_id = u.user_id
                WHERE 1=1 ${whereClause}
                ORDER BY pa.submitted_at DESC
            `;

            const result = await client.query(query, queryParams);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Applications');

            worksheet.columns = [
                { header: 'Application ID', key: 'application_id', width: 15 },
                { header: 'Submission Date', key: 'submitted_at', width: 20 },
                { header: 'Application Status', key: 'status', width: 18 },
                { header: 'Auction Status', key: 'calculated_status', width: 18 },
                { header: 'Auction End Time', key: 'auction_end_time', width: 20 },
                { header: 'Views', key: 'opened_count', width: 10 },
                { header: 'Offers Received', key: 'offers_count', width: 15 },
                { header: 'Financing Category / Type', key: 'financing_type', width: 22 },
                { header: 'Requested Amount (range)', key: 'amount_range', width: 22 },
                { header: 'Requested Amount (value)', key: 'requested_financing_amount', width: 22 },
                { header: 'Annual Revenue', key: 'annual_revenue', width: 22 },
                { header: 'Business Age', key: 'business_age', width: 20 },
                { header: 'Sales via POS Devices', key: 'has_pos', width: 20 },
                { header: 'Business Name', key: 'trade_name', width: 30 },
                { header: 'CR Number', key: 'cr_number', width: 20 },
                { header: 'City', key: 'city', width: 20 },
                { header: 'Sector / Business Activity', key: 'sector', width: 30 },
                { header: 'Contact Person', key: 'contact_person', width: 25 },
                { header: 'Mobile Number', key: 'contact_person_number', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Wathiq / Business Registry Data (CR National Number)', key: 'cr_national_number', width: 30 },
                { header: 'Legal Form', key: 'legal_form', width: 22 },
                { header: 'Registration Status', key: 'registration_status', width: 20 },
                { header: 'Issue Date', key: 'issue_date_gregorian', width: 18 },
                { header: 'Confirmation Date', key: 'confirmation_date_gregorian', width: 18 },
                // "Any additional application fields submitted by the customer"
                { header: 'Notes', key: 'notes', width: 40 },
                { header: 'Uploaded Filename', key: 'uploaded_filename', width: 30 },
                // "Any internal fields available in the admin dashboard"
                { header: 'Admin Notes', key: 'admin_notes', width: 40 },
                { header: 'Consent Given At', key: 'consent_at', width: 20 },
                { header: 'Consent Version', key: 'consent_version', width: 16 },
                // Internal prioritization indicator — admins and financing partners
                // only. Not a credit or affordability assessment.
                { header: 'Lead Priority', key: 'lead_tier', width: 18 },
                { header: 'Lead Score (0-100)', key: 'lead_score', width: 18 }
            ];

            const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
            const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB') : '');
            const fmtMoney = (v) => (v != null && v !== '' && !isNaN(parseFloat(v)) ? `SAR ${parseFloat(v).toFixed(2)}` : '');

            result.rows.forEach(row => {
                worksheet.addRow({
                    application_id: row.application_id,
                    submitted_at: fmtDateTime(row.submitted_at),
                    status: row.status || '',
                    calculated_status: row.calculated_status || '',
                    auction_end_time: fmtDateTime(row.auction_end_time),
                    opened_count: row.opened_count || 0,
                    offers_count: row.offers_count || 0,
                    financing_type: formatFinancingType(row.financing_type, 'en'),
                    // Historical rows have no code — fall back to the stored label.
                    amount_range: formatAmountRange(row.amount_range_code, 'en', row.approximate_financing_amount),
                    requested_financing_amount: fmtMoney(row.requested_financing_amount),
                    annual_revenue: formatRevenueRange(row.annual_revenue_code, 'en', { isPreRevenue: row.is_pre_revenue === true }),
                    business_age: formatAgeRange(row.business_age_range_code, 'en'),
                    has_pos: formatHasPos(row.own_pos_system, 'en'),
                    trade_name: row.trade_name || '',
                    cr_number: row.cr_number || '',
                    city: formatCity(row.city_code, 'en', row.city),
                    sector: formatSector(row.sector_code, 'en', row.sector),
                    contact_person: row.contact_person || '',
                    contact_person_number: row.contact_person_number || '',
                    email: row.email || '',
                    cr_national_number: row.cr_national_number || '',
                    legal_form: row.legal_form || '',
                    registration_status: row.registration_status || '',
                    issue_date_gregorian: fmtDate(row.issue_date_gregorian),
                    confirmation_date_gregorian: fmtDate(row.confirmation_date_gregorian),
                    notes: row.notes || '',
                    uploaded_filename: row.uploaded_filename || '',
                    admin_notes: row.admin_notes || '',
                    consent_at: fmtDateTime(row.consent_at),
                    consent_version: row.consent_version || '',
                    lead_tier: row.lead_tier ? TIER_LABELS[row.lead_tier].en : '',
                    lead_score: row.lead_score != null ? row.lead_score : ''
                });
            });

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            const buffer = await workbook.xlsx.writeBuffer();
            const dateStamp = new Date().toISOString().slice(0, 10);

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="applications-${dateStamp}.xlsx"`
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error exporting applications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export applications' },
            { status: 500 }
        );
    }
}

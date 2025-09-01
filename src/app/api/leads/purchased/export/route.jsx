import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req) {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(req, 'bank_user');
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
        );
    }
    
    let bankUserId = authResult.user.user_id;
    
    // If this is a bank employee, get the main bank user ID
    if (authResult.user.user_type === 'bank_employee') {
        try {
            const bankEmployeeResult = await pool.query(
                'SELECT bank_user_id FROM bank_employees WHERE user_id = $1',
                [authResult.user.user_id]
            );
            
            if (bankEmployeeResult.rows.length > 0) {
                bankUserId = bankEmployeeResult.rows[0].bank_user_id;
            }
        } catch (error) {
            console.error('Error getting bank user ID for employee:', error);
            return NextResponse.json({ success: false, error: 'Failed to get bank information' }, { status: 500 });
        }
    }

    try {
        // Enhanced query to get comprehensive data for each approved lead
        const leadsResult = await pool.query(
            `SELECT 
                -- Application Basic Info
                pa.application_id,
                pa.submitted_at,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.notes,
                pa.number_of_pos_devices,
                pa.city_of_operation,
                pa.own_pos_system,
                pa.uploaded_filename,
                pa.revenue_collected,
                pa.offers_count,
                
                -- POS Application Fields
                pa.pos_provider_name,
                pa.pos_age_duration_months,
                pa.avg_monthly_pos_sales,
                pa.requested_financing_amount,
                pa.preferred_repayment_period_months,
                
                -- Business Contact Information (NOT from Wathiq)
                pa.contact_person,
                pa.contact_person_number,
                u.email as business_contact_email,
                
                -- Wathiq Business Data
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.registration_status,
                bu.legal_form,
                bu.issue_date_gregorian,
                bu.confirmation_date_gregorian,
                bu.address,
                bu.sector,
                bu.city,
                bu.has_ecommerce,
                bu.store_url,
                bu.cr_capital,
                bu.cash_capital,
                bu.in_kind_capital,
                bu.avg_capital,
                bu.management_structure,
                bu.management_managers,
                bu.activities,
                bu.contact_info,
                bu.admin_notes
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             WHERE $1 = ANY(pa.purchased_by) 
                OR EXISTS (SELECT 1 FROM application_offers WHERE submitted_application_id = pa.application_id AND submitted_by_user_id = $1)
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        // Get detailed offers for each lead
        const leads = leadsResult.rows;
        const leadsWithOffers = [];

        for (const lead of leads) {
            // Get offers for this lead
            const offersResult = await pool.query(
                `SELECT 
                    ao.offer_id,
                    ao.submitted_at as offer_submitted_at,
                    ao.approved_financing_amount,
                    ao.proposed_repayment_period_months,
                    ao.interest_rate,
                    ao.monthly_installment_amount,
                    ao.grace_period_months,
                    ao.offer_comment,
                    ao.status as offer_status,
                    ao.uploaded_filename,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc,
                    ao.offer_settlement_time_mada,
                    ao.deal_value,
                    ao.commission_rate,
                    ao.commission_amount,
                    ao.bank_revenue,
                    bu.entity_name as submitted_by_bank_name
                FROM application_offers ao
                LEFT JOIN users bu ON ao.submitted_by_user_id = bu.user_id
                WHERE ao.submitted_application_id = $1 AND ao.submitted_by_user_id = $2
                ORDER BY ao.submitted_at DESC`,
                [lead.application_id, bankUserId]
            );

            leadsWithOffers.push({
                ...lead,
                offers: offersResult.rows
            });
        }

        if (leadsWithOffers.length === 0) {
            return NextResponse.json({ success: false, error: 'No purchased leads found' }, { status: 404 });
        }

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Approved Leads');

        // Define columns in the new order: Contact Details -> Business Info -> Application Details -> Offer Details
        worksheet.columns = [
            // 1. CONTACT DETAILS (First)
            { header: 'Contact Person', key: 'contact_person', width: 25 },
            { header: 'Phone Number', key: 'contact_person_number', width: 20 },
            { header: 'Email', key: 'business_contact_email', width: 30 },
            
            // 2. BUSINESS INFORMATION
            { header: 'Company Name', key: 'trade_name', width: 30 },
            { header: 'CR Number', key: 'cr_number', width: 20 },
            { header: 'CR National Number', key: 'cr_national_number', width: 25 },
            { header: 'City', key: 'city', width: 20 },
            { header: 'Sector', key: 'sector', width: 40 },
            { header: 'Activities', key: 'activities', width: 50 },
            { header: 'Legal Form', key: 'legal_form', width: 25 },
            { header: 'Registration Status', key: 'registration_status', width: 20 },
            { header: 'Issue Date', key: 'issue_date_gregorian', width: 20 },
            { header: 'Confirmation Date', key: 'confirmation_date_gregorian', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'CR Capital', key: 'cr_capital', width: 20 },
            { header: 'Cash Capital', key: 'cash_capital', width: 20 },
            { header: 'In-Kind Capital', key: 'in_kind_capital', width: 20 },
            { header: 'Average Capital', key: 'avg_capital', width: 20 },
            { header: 'Has E-commerce', key: 'has_ecommerce', width: 15 },
            { header: 'Store URL', key: 'store_url', width: 30 },
            { header: 'Management Structure', key: 'management_structure', width: 25 },
            { header: 'Management Managers', key: 'management_managers', width: 30 },
            { header: 'Contact Info', key: 'contact_info', width: 30 },
            { header: 'Admin Notes', key: 'admin_notes', width: 30 },
            
            // 3. APPLICATION DETAILS
            { header: 'Application ID', key: 'application_id', width: 15 },
            { header: 'Submitted Date', key: 'submitted_at', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'POS Provider Name', key: 'pos_provider_name', width: 25 },
            { header: 'POS Age Duration (months)', key: 'pos_age_duration_months', width: 25 },
            { header: 'Average Monthly POS Sales (SAR)', key: 'avg_monthly_pos_sales', width: 30 },
            { header: 'Requested Financing Amount (SAR)', key: 'requested_financing_amount', width: 30 },
            { header: 'Preferred Repayment Period (months)', key: 'preferred_repayment_period_months', width: 30 },
            { header: 'Number of POS Devices', key: 'number_of_pos_devices', width: 20 },
            { header: 'Own POS System', key: 'own_pos_system', width: 15 },
            { header: 'City of Operation', key: 'city_of_operation', width: 20 },
            { header: 'Notes', key: 'notes', width: 40 },
            { header: 'Uploaded Filename', key: 'uploaded_filename', width: 30 },
            { header: 'Revenue Collected', key: 'revenue_collected', width: 20 },
            { header: 'Offers Count', key: 'offers_count', width: 15 },
            
            // 4. OFFER DETAILS
            { header: 'Offer ID', key: 'offer_id', width: 15 },
            { header: 'Bank Name', key: 'bank_name', width: 25 },
            { header: 'Offer Status', key: 'offer_status', width: 15 },
            { header: 'Approved Amount (SAR)', key: 'approved_amount', width: 25 },
            { header: 'Repayment Period (months)', key: 'repayment_period', width: 25 },
            { header: 'Interest Rate (%)', key: 'interest_rate', width: 20 },
            { header: 'Monthly Installment (SAR)', key: 'monthly_installment', width: 25 },
            { header: 'Grace Period (months)', key: 'grace_period', width: 20 },
            { header: 'Offer Submitted Date', key: 'offer_submitted_at', width: 20 },
            { header: 'Full Offer Terms', key: 'full_offer_terms', width: 50 },
            { header: 'Additional Comments', key: 'offer_comment', width: 40 },
            { header: 'Deal Value', key: 'deal_value', width: 20 },
            { header: 'Commission Rate', key: 'commission_rate', width: 20 },
            { header: 'Commission Amount', key: 'commission_amount', width: 20 },
            { header: 'Bank Revenue', key: 'bank_revenue', width: 20 },
            { header: 'Offer Setup Fee', key: 'offer_device_setup_fee', width: 20 },
            { header: 'Mada Transaction Fee', key: 'offer_transaction_fee_mada', width: 25 },
            { header: 'Visa/MC Transaction Fee', key: 'offer_transaction_fee_visa_mc', width: 30 },
            { header: 'Settlement Time (Mada)', key: 'offer_settlement_time_mada', width: 25 }
        ];

        // Add data rows in the new order: Contact Details -> Business Info -> Application Details -> Offer Details
        leadsWithOffers.forEach(row => {
            worksheet.addRow({
                // 1. CONTACT DETAILS (First)
                contact_person: row.contact_person || '',
                contact_person_number: row.contact_person_number || '',
                business_contact_email: row.business_contact_email || '',
                
                // 2. BUSINESS INFORMATION
                trade_name: row.trade_name || '',
                cr_number: row.cr_number || '',
                cr_national_number: row.cr_national_number || '',
                city: row.city || '',
                sector: row.sector || '',
                activities: Array.isArray(row.activities) ? row.activities.join(', ') : (row.activities || ''),
                legal_form: row.legal_form || '',
                registration_status: row.registration_status || '',
                issue_date_gregorian: row.issue_date_gregorian || '',
                confirmation_date_gregorian: row.confirmation_date_gregorian || '',
                address: row.address || '',
                cr_capital: row.cr_capital ? `SAR ${parseFloat(row.cr_capital).toFixed(2)}` : '',
                cash_capital: row.cash_capital ? `SAR ${parseFloat(row.cash_capital).toFixed(2)}` : '',
                in_kind_capital: row.in_kind_capital ? `SAR ${parseFloat(row.in_kind_capital).toFixed(2)}` : '',
                avg_capital: row.avg_capital ? `SAR ${parseFloat(row.avg_capital).toFixed(2)}` : '',
                has_ecommerce: row.has_ecommerce ? 'Yes' : 'No',
                store_url: row.store_url || '',
                management_structure: row.management_structure || '',
                management_managers: Array.isArray(row.management_managers) ? row.management_managers.join(', ') : (row.management_managers || ''),
                contact_info: row.contact_info || '',
                admin_notes: row.admin_notes || '',
                
                // 3. APPLICATION DETAILS
                application_id: row.application_id,
                submitted_at: row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-GB') : '',
                status: row.status || '',
                pos_provider_name: row.pos_provider_name || 'Not specified',
                pos_age_duration_months: row.pos_age_duration_months || 'Not specified',
                avg_monthly_pos_sales: row.avg_monthly_pos_sales ? `SAR ${parseFloat(row.avg_monthly_pos_sales).toFixed(2)}` : 'Not specified',
                requested_financing_amount: row.requested_financing_amount ? `SAR ${parseFloat(row.requested_financing_amount).toFixed(2)}` : 'Not specified',
                preferred_repayment_period_months: row.preferred_repayment_period_months ? `${row.preferred_repayment_period_months} months` : 'Not specified',
                number_of_pos_devices: row.number_of_pos_devices || '',
                own_pos_system: row.own_pos_system ? 'Yes' : 'No',
                city_of_operation: row.city_of_operation || '',
                notes: row.notes || '',
                uploaded_filename: row.uploaded_filename || '',
                revenue_collected: row.revenue_collected ? `SAR ${parseFloat(row.revenue_collected).toFixed(2)}` : '',
                offers_count: row.offers_count || 0,
                
                // 4. OFFER DETAILS
                offer_id: row.offers && row.offers.length > 0 ? row.offers[0].offer_id : '',
                bank_name: row.offers && row.offers.length > 0 ? row.offers[0].submitted_by_bank_name : '',
                offer_status: row.offers && row.offers.length > 0 ? row.offers[0].offer_status : '',
                approved_amount: row.offers && row.offers.length > 0 && row.offers[0].approved_financing_amount ? `SAR ${parseFloat(row.offers[0].approved_financing_amount).toFixed(2)}` : '',
                repayment_period: row.offers && row.offers.length > 0 && row.offers[0].proposed_repayment_period_months ? `${row.offers[0].proposed_repayment_period_months} months` : '',
                interest_rate: row.offers && row.offers.length > 0 && row.offers[0].interest_rate ? `${parseFloat(row.offers[0].interest_rate).toFixed(2)}%` : '',
                monthly_installment: row.offers && row.offers.length > 0 && row.offers[0].monthly_installment_amount ? `SAR ${parseFloat(row.offers[0].monthly_installment_amount).toFixed(2)}` : '',
                grace_period: row.offers && row.offers.length > 0 && row.offers[0].grace_period_months ? `${row.offers[0].grace_period_months} months` : '',
                offer_submitted_at: row.offers && row.offers.length > 0 && row.offers[0].offer_submitted_at ? new Date(row.offers[0].offer_submitted_at).toLocaleDateString('en-GB') : '',
                full_offer_terms: row.offers && row.offers.length > 0 ? `Approved Amount: ${row.offers[0].approved_financing_amount || 'N/A'}, Repayment Period: ${row.offers[0].proposed_repayment_period_months || 'N/A'} months, Interest Rate: ${row.offers[0].interest_rate || 'N/A'}%, Monthly Installment: ${row.offers[0].monthly_installment_amount || 'N/A'}, Grace Period: ${row.offers[0].grace_period_months || 'N/A'} months` : '',
                offer_comment: row.offers && row.offers.length > 0 ? row.offers[0].offer_comment : '',
                deal_value: row.offers && row.offers.length > 0 && row.offers[0].deal_value ? `SAR ${parseFloat(row.offers[0].deal_value).toFixed(2)}` : '',
                commission_rate: row.offers && row.offers.length > 0 && row.offers[0].commission_rate ? `${parseFloat(row.offers[0].commission_rate).toFixed(2)}%` : '',
                commission_amount: row.offers && row.offers.length > 0 && row.offers[0].commission_amount ? `SAR ${parseFloat(row.offers[0].commission_amount).toFixed(2)}` : '',
                bank_revenue: row.offers && row.offers.length > 0 && row.offers[0].bank_revenue ? `SAR ${parseFloat(row.offers[0].bank_revenue).toFixed(2)}` : '',
                offer_device_setup_fee: row.offers && row.offers.length > 0 && row.offers[0].offer_device_setup_fee ? `SAR ${parseFloat(row.offers[0].offer_device_setup_fee).toFixed(2)}` : '',
                offer_transaction_fee_mada: row.offers && row.offers.length > 0 && row.offers[0].offer_transaction_fee_mada ? `${parseFloat(row.offers[0].offer_transaction_fee_mada).toFixed(2)}%` : '',
                offer_transaction_fee_visa_mc: row.offers && row.offers.length > 0 && row.offers[0].offer_transaction_fee_visa_mc ? `${parseFloat(row.offers[0].offer_transaction_fee_visa_mc).toFixed(2)}%` : '',
                offer_settlement_time_mada: row.offers && row.offers.length > 0 && row.offers[0].offer_settlement_time_mada ? `${row.offers[0].offer_settlement_time_mada} days` : ''
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="approved-leads.xlsx"'
            }
        });

    } catch (err) {
        console.error('Failed to export purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to export purchased leads' }, { status: 500 });
    }
}

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
    
    const bankUserId = authResult.user.user_id;

    try {
        const result = await pool.query(
            `SELECT 
                sa.application_id,
                sa.status,
                sa.submitted_at,
                sa.auction_end_time,
                sa.offers_count,
                sa.revenue_collected,
                
                -- Business Information (Wathiq API data)
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.registration_status,
                bu.address,
                bu.sector,
                bu.cr_capital,
                bu.cash_capital,
                bu.in_kind_capital,
                bu.has_ecommerce,
                bu.store_url,
                bu.legal_form,
                bu.issue_date_gregorian,
                bu.management_structure,
                bu.management_managers,
                bu.contact_info,
                
                -- Application Details
                pa.notes,
                pa.number_of_pos_devices,
                pa.city_of_operation,
                pa.own_pos_system,
                pa.uploaded_filename,
                
                -- Business Owner Personal Details (NOT from Wathiq API)
                pa.contact_person as business_contact_person,
                pa.contact_person_number as business_contact_telephone,
                u.email as business_contact_email,
                
                -- Approved Lead Information (from approved_leads table)
                al.purchased_at,
                al.offer_submitted_at,
                al.offer_device_setup_fee,
                al.offer_transaction_fee_mada,
                al.offer_transaction_fee_visa_mc,
                al.offer_settlement_time_mada,
                al.offer_comment,
                al.status as lead_status
                
             FROM submitted_applications sa
             JOIN pos_application pa ON sa.application_id = pa.application_id
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             JOIN approved_leads al ON al.application_id = sa.application_id AND al.bank_user_id = $1
             WHERE $1 = ANY(sa.purchased_by)
             ORDER BY al.purchased_at DESC`,
            [bankUserId]
        );

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Purchased Leads');

        // Define columns
        worksheet.columns = [
            { header: 'Application ID', key: 'application_id', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Submitted Date', key: 'submitted_at', width: 20 },
            { header: 'Auction End Date', key: 'auction_end_time', width: 20 },
            { header: 'Offers Count', key: 'offers_count', width: 15 },
            { header: 'Revenue Collected', key: 'revenue_collected', width: 20 },
            
            // Business Information
            { header: 'Trade Name', key: 'trade_name', width: 30 },
            { header: 'CR Number', key: 'cr_number', width: 20 },
            { header: 'CR National Number', key: 'cr_national_number', width: 25 },
            { header: 'Registration Status', key: 'registration_status', width: 20 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Sector', key: 'sector', width: 25 },
            { header: 'CR Capital', key: 'cr_capital', width: 15 },
            { header: 'Cash Capital', key: 'cash_capital', width: 15 },
            { header: 'In-Kind Capital', key: 'in_kind_capital', width: 15 },
            { header: 'Has E-commerce', key: 'has_ecommerce', width: 15 },
            { header: 'Store URL', key: 'store_url', width: 30 },
            { header: 'Legal Form', key: 'legal_form', width: 25 },
            { header: 'Issue Date', key: 'issue_date_gregorian', width: 15 },
            { header: 'Management Structure', key: 'management_structure', width: 25 },
            { header: 'Management Managers', key: 'management_managers', width: 30 },
            
            // Application Details
            { header: 'Notes', key: 'notes', width: 30 },
            { header: 'Number of POS Devices', key: 'number_of_pos_devices', width: 20 },
            { header: 'City of Operation', key: 'city_of_operation', width: 20 },
            { header: 'Own POS System', key: 'own_pos_system', width: 20 },
            { header: 'Uploaded Document', key: 'uploaded_filename', width: 30 },
            
            // Business Owner Personal Details (NOT from Wathiq API)
            { header: 'Contact Person', key: 'business_contact_person', width: 25 },
            { header: 'Contact Telephone', key: 'business_contact_telephone', width: 20 },
            { header: 'Contact Email', key: 'business_contact_email', width: 30 },
            
            // Approved Lead Information
            { header: 'Purchased Date', key: 'purchased_at', width: 20 },
            { header: 'Offer Submitted Date', key: 'offer_submitted_at', width: 20 },
            { header: 'Device Setup Fee', key: 'offer_device_setup_fee', width: 20 },
            { header: 'Mada Transaction Fee', key: 'offer_transaction_fee_mada', width: 20 },
            { header: 'Visa/MC Transaction Fee', key: 'offer_transaction_fee_visa_mc', width: 25 },
            { header: 'Mada Settlement Time', key: 'offer_settlement_time_mada', width: 20 },
            { header: 'Offer Comment', key: 'offer_comment', width: 30 },
            { header: 'Lead Status', key: 'lead_status', width: 15 }
        ];

        // Add data rows
        result.rows.forEach(row => {
            // Format the data for Excel
            const excelRow = {
                ...row,
                submitted_at: row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : '',
                auction_end_time: row.auction_end_time ? new Date(row.auction_end_time).toLocaleDateString() : '',
                issue_date_gregorian: row.issue_date_gregorian ? new Date(row.issue_date_gregorian).toLocaleDateString() : '',
                purchased_at: row.purchased_at ? new Date(row.purchased_at).toLocaleDateString() : '',
                offer_submitted_at: row.offer_submitted_at ? new Date(row.offer_submitted_at).toLocaleDateString() : '',
                management_managers: Array.isArray(row.management_managers) ? row.management_managers.join(', ') : row.management_managers,
                has_ecommerce: row.has_ecommerce ? 'Yes' : 'No',
                own_pos_system: row.own_pos_system ? 'Yes' : 'No',
                revenue_collected: row.revenue_collected ? `SAR ${row.revenue_collected}` : '',
                cr_capital: row.cr_capital ? `SAR ${row.cr_capital}` : '',
                cash_capital: row.cash_capital ? `SAR ${row.cash_capital}` : '',
                in_kind_capital: row.in_kind_capital ? `SAR ${row.in_kind_capital}` : '',
                offer_device_setup_fee: row.offer_device_setup_fee ? `SAR ${row.offer_device_setup_fee}` : '',
                offer_transaction_fee_mada: row.offer_transaction_fee_mada ? `${row.offer_transaction_fee_mada}%` : '',
                offer_transaction_fee_visa_mc: row.offer_transaction_fee_visa_mc ? `${row.offer_transaction_fee_visa_mc}%` : '',
                offer_settlement_time_mada: row.offer_settlement_time_mada ? `${row.offer_settlement_time_mada} days` : ''
            };
            
            worksheet.addRow(excelRow);
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
        
        // Create response with Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="purchased-leads-${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

        return response;

    } catch (err) {
        console.error('Failed to export purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to export purchased leads' }, { status: 500 });
    }
}

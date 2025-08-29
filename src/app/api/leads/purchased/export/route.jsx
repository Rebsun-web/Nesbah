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
        // Enhanced query to get comprehensive data for each approved lead
        const result = await pool.query(
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
                bu.is_verified,
                bu.verification_date,
                bu.admin_notes,
                bu.contact_info,
                
                -- Bank Offer Information
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_comment,
                ao.submitted_at as offer_submitted_at
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             LEFT JOIN application_offers ao ON ao.submitted_application_id = pa.application_id AND ao.submitted_by_user_id = $1
             WHERE $1 = ANY(pa.purchased_by)
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Approved Leads');

        // Set up styling
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } },
            alignment: { horizontal: 'center', vertical: 'middle' }
        };

        const sectionHeaderStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
            alignment: { horizontal: 'center', vertical: 'middle' }
        };

        const separatorStyle = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
        };

        let currentRow = 1;

        // Add title
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const titleCell = worksheet.getCell(`A${currentRow}`);
        titleCell.value = 'APPROVED LEADS EXPORT';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FF2E5BBA' } };
        titleCell.alignment = { horizontal: 'center' };
        currentRow += 2;

        // Add export info
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const infoCell = worksheet.getCell(`A${currentRow}`);
        infoCell.value = `Exported on: ${new Date().toLocaleString('en-GB')} | Total Approved Leads: ${result.rows.length}`;
        infoCell.font = { italic: true, color: { argb: 'FF666666' } };
        infoCell.alignment = { horizontal: 'center' };
        currentRow += 2;

        // Process each approved lead
        result.rows.forEach((lead, index) => {
            // Add lead separator
            if (index > 0) {
                worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
                const separatorCell = worksheet.getCell(`A${currentRow}`);
                separatorCell.fill = separatorStyle;
                currentRow += 1;
            }

            // Lead Header
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const leadHeaderCell = worksheet.getCell(`A${currentRow}`);
            leadHeaderCell.value = `APPROVED LEAD #${index + 1} - ${lead.trade_name || 'Unknown Company'}`;
            leadHeaderCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            leadHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } };
            leadHeaderCell.alignment = { horizontal: 'center' };
            currentRow += 1;

            // 1. LEAD CONTACT INFORMATION
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const contactHeaderCell = worksheet.getCell(`A${currentRow}`);
            contactHeaderCell.value = 'LEAD CONTACT INFORMATION';
            contactHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            contactHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            contactHeaderCell.alignment = { horizontal: 'center' };
            currentRow += 1;

            // Contact Information Data
            const contactData = [
                ['Contact Person', lead.contact_person || 'Not provided'],
                ['Phone Number', lead.contact_person_number || 'Not provided'],
                ['Email', lead.business_contact_email || 'Not provided'],
                ['Application ID', lead.application_id?.toString() || 'N/A'],
                ['Submitted Date', lead.submitted_at ? new Date(lead.submitted_at).toLocaleDateString('en-GB') : 'N/A'],
                ['Status', lead.status === 'live_auction' ? 'Live Auction' : lead.status || 'N/A']
            ];

            contactData.forEach(([label, value]) => {
                worksheet.getCell(`A${currentRow}`).value = label;
                worksheet.getCell(`A${currentRow}`).font = { bold: true };
                worksheet.getCell(`B${currentRow}`).value = value;
                currentRow += 1;
            });

            currentRow += 1;

            // 2. LEAD WATHIQ DATA
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const wathiqHeaderCell = worksheet.getCell(`A${currentRow}`);
            wathiqHeaderCell.value = 'LEAD WATHIQ DATA';
            wathiqHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            wathiqHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            wathiqHeaderCell.alignment = { horizontal: 'center' };
            currentRow += 1;

            // Wathiq Data
            const wathiqData = [
                ['Company Name', lead.trade_name || 'N/A'],
                ['CR Number', lead.cr_number || 'N/A'],
                ['CR National Number', lead.cr_national_number || 'N/A'],
                ['Registration Status', lead.registration_status || 'N/A'],
                ['Legal Form', lead.legal_form || 'N/A'],
                ['Issue Date', lead.issue_date_gregorian || 'N/A'],
                ['Confirmation Date', lead.confirmation_date_gregorian || 'N/A'],
                ['Address', lead.address || 'N/A'],
                ['Sector', lead.sector || 'N/A'],
                ['City', lead.city || 'N/A'],
                ['Has E-commerce', lead.has_ecommerce ? 'Yes' : 'No'],
                ['Store URL', lead.store_url || 'N/A'],
                ['CR Capital', lead.cr_capital ? `SAR ${parseFloat(lead.cr_capital).toLocaleString()}` : 'N/A'],
                ['Cash Capital', lead.cash_capital ? `SAR ${parseFloat(lead.cash_capital).toLocaleString()}` : 'N/A'],
                ['In-Kind Capital', lead.in_kind_capital || 'N/A'],
                ['Average Capital', lead.avg_capital ? `SAR ${parseFloat(lead.avg_capital).toLocaleString()}` : 'N/A'],
                ['Management Structure', lead.management_structure || 'N/A'],
                ['Management Managers', lead.management_managers ? JSON.stringify(lead.management_managers) : 'N/A'],
                ['Activities', lead.activities ? lead.activities.join(', ') : 'N/A'],
                ['Is Verified', lead.is_verified ? 'Yes' : 'No'],
                ['Verification Date', lead.verification_date || 'N/A'],
                ['Admin Notes', lead.admin_notes || 'N/A'],
                ['Contact Info', lead.contact_info ? JSON.stringify(lead.contact_info) : 'N/A']
            ];

            wathiqData.forEach(([label, value]) => {
                worksheet.getCell(`A${currentRow}`).value = label;
                worksheet.getCell(`A${currentRow}`).font = { bold: true };
                worksheet.getCell(`B${currentRow}`).value = value;
                currentRow += 1;
            });

            currentRow += 1;

            // 3. LEAD SUBMITTED APPLICATION DATA
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const appHeaderCell = worksheet.getCell(`A${currentRow}`);
            appHeaderCell.value = 'LEAD SUBMITTED APPLICATION DATA';
            appHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            appHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            appHeaderCell.alignment = { horizontal: 'center' };
            currentRow += 1;

            // Application Data
            const appData = [
                ['Notes', lead.notes || 'N/A'],
                ['Number of POS Devices', lead.number_of_pos_devices || 'N/A'],
                ['City of Operation', lead.city_of_operation || 'N/A'],
                ['Own POS System', lead.own_pos_system || 'N/A'],
                ['Uploaded Filename', lead.uploaded_filename || 'N/A'],
                ['Revenue Collected', lead.revenue_collected ? `SAR ${parseFloat(lead.revenue_collected).toFixed(2)}` : 'SAR 0.00'],
                ['Offers Count', lead.offers_count?.toString() || '0']
            ];

            appData.forEach(([label, value]) => {
                worksheet.getCell(`A${currentRow}`).value = label;
                worksheet.getCell(`A${currentRow}`).font = { bold: true };
                worksheet.getCell(`B${currentRow}`).value = value;
                currentRow += 1;
            });

            // Add bank offer information if available
            if (lead.offer_device_setup_fee || lead.offer_transaction_fee_mada) {
                currentRow += 1;
                
                worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
                const offerHeaderCell = worksheet.getCell(`A${currentRow}`);
                offerHeaderCell.value = 'BANK OFFER DETAILS';
                offerHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                offerHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                offerHeaderCell.alignment = { horizontal: 'center' };
                currentRow += 1;

                const offerData = [
                    ['Device Setup Fee', lead.offer_device_setup_fee ? `SAR ${parseFloat(lead.offer_device_setup_fee).toFixed(2)}` : 'N/A'],
                    ['Transaction Fee (Mada)', lead.offer_transaction_fee_mada ? `${parseFloat(lead.offer_transaction_fee_mada).toFixed(2)}%` : 'N/A'],
                    ['Transaction Fee (Visa/MC)', lead.offer_transaction_fee_visa_mc ? `${parseFloat(lead.offer_transaction_fee_visa_mc).toFixed(2)}%` : 'N/A'],
                    ['Settlement Time (Mada)', lead.offer_settlement_time_mada || 'N/A'],
                    ['Offer Comment', lead.offer_comment || 'N/A'],
                    ['Offer Submitted At', lead.offer_submitted_at ? new Date(lead.offer_submitted_at).toLocaleString('en-GB') : 'N/A']
                ];

                offerData.forEach(([label, value]) => {
                    worksheet.getCell(`A${currentRow}`).value = label;
                    worksheet.getCell(`A${currentRow}`).font = { bold: true };
                    worksheet.getCell(`B${currentRow}`).value = value;
                    currentRow += 1;
                });
            }

            currentRow += 2; // Add extra space between leads
        });

        // Auto-adjust column widths
        worksheet.columns.forEach(column => {
            column.width = Math.max(column.width || 15, 20);
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Create response with Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="approved-leads-${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

        return response;

    } catch (err) {
        console.error('Failed to export approved leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to export approved leads' }, { status: 500 });
    }
}

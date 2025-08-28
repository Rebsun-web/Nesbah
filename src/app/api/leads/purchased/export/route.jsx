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
        // UPDATED: Query using pos_application table with new structure - matching table structure
        const result = await pool.query(
            `SELECT 
                bu.trade_name,
                pa.contact_person,
                pa.contact_person_number,
                u.email as business_contact_email,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.submitted_at,
                pa.application_id
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
        const worksheet = workbook.addWorksheet('Purchased Leads');

        // Define columns - matching exact table structure from purchased leads page
        worksheet.columns = [
            { header: 'COMPANY NAME', key: 'trade_name', width: 30 },
            { header: 'CONTACT PERSON', key: 'contact_person', width: 25 },
            { header: 'PHONE NUMBER', key: 'contact_person_number', width: 20 },
            { header: 'EMAIL', key: 'business_contact_email', width: 30 },
            { header: 'STATUS', key: 'status', width: 15 },
            { header: 'SUBMITTED DATE', key: 'submitted_at', width: 20 },
            { header: 'APPLICATION ID', key: 'application_id', width: 15 }
        ];

        // Add data rows - matching table structure
        result.rows.forEach(row => {
            // Format the data for Excel - matching the table display
            const excelRow = {
                trade_name: row.trade_name || '',
                contact_person: row.contact_person || 'Not provided',
                contact_person_number: row.contact_person_number || 'Not provided',
                business_contact_email: row.business_contact_email || 'business@nesbah.com',
                status: row.status === 'live_auction' ? 'Live Auction' : row.status || '',
                submitted_at: row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-GB') : '',
                application_id: row.application_id || ''
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

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const { searchParams } = new URL(req.url);
        const alert_type = searchParams.get('alert_type');
        const severity = searchParams.get('severity');
        const is_resolved = searchParams.get('is_resolved');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        const client = await pool.connectWithRetry();
        
        try {
            let query = `
                SELECT 
                    sa.alert_id,
                    sa.alert_type,
                    sa.severity,
                    sa.title,
                    sa.message,
                    sa.related_entity_type,
                    sa.related_entity_id,
                    sa.is_resolved,
                    sa.resolved_by,
                    sa.resolved_at,
                    sa.created_at,
                    au.full_name as resolved_by_name
                FROM system_alerts sa
                LEFT JOIN admin_users au ON sa.resolved_by = au.admin_id
                WHERE 1=1
            `;

            const queryParams = [];
            let paramCount = 0;

            if (alert_type) {
                paramCount++;
                query += ` AND sa.alert_type = $${paramCount}`;
                queryParams.push(alert_type);
            }

            if (severity) {
                paramCount++;
                query += ` AND sa.severity = $${paramCount}`;
                queryParams.push(severity);
            }

            if (is_resolved !== null && is_resolved !== undefined) {
                paramCount++;
                query += ` AND sa.is_resolved = $${paramCount}`;
                queryParams.push(is_resolved === 'true');
            }

            query += ` ORDER BY sa.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await client.query(query, queryParams);

            // Get alert statistics
            const statsQuery = `
                SELECT 
                    alert_type,
                    severity,
                    COUNT(*) as count,
                    COUNT(CASE WHEN is_resolved = false THEN 1 END) as unresolved_count
                FROM system_alerts
                GROUP BY alert_type, severity
                ORDER BY alert_type, severity;
            `;

            const statsResult = await client.query(statsQuery);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM system_alerts WHERE 1=1';
            const countParams = [];
            paramCount = 0;

            if (alert_type) {
                paramCount++;
                countQuery += ` AND alert_type = $${paramCount}`;
                countParams.push(alert_type);
            }

            if (severity) {
                paramCount++;
                countQuery += ` AND severity = $${paramCount}`;
                countParams.push(severity);
            }

            if (is_resolved !== null && is_resolved !== undefined) {
                paramCount++;
                countQuery += ` AND is_resolved = $${paramCount}`;
                countParams.push(is_resolved === 'true');
            }

            const countResult = await client.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return NextResponse.json({
                success: true,
                data: {
                    alerts: result.rows,
                    statistics: statsResult.rows,
                    pagination: {
                        total,
                        limit,
                        offset,
                        has_more: offset + limit < total
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin system alerts error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch system alerts' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const body = await req.json();
        const {
            alert_type,
            severity = 'medium',
            title,
            message,
            related_entity_type,
            related_entity_id
        } = body;

        // Validate required fields
        if (!alert_type || !title || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: alert_type, title, message' },
                { status: 400 }
            );
        }

        // Validate alert type
        const validAlertTypes = ['deadline_approaching', 'payment_failure', 'system_error', 'revenue_anomaly', 'user_limit_reached'];
        if (!validAlertTypes.includes(alert_type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid alert_type' },
                { status: 400 }
            );
        }

        // Validate severity
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!validSeverities.includes(severity)) {
            return NextResponse.json(
                { success: false, error: 'Invalid severity level' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                `
                INSERT INTO system_alerts 
                    (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING alert_id
                `,
                [alert_type, severity, title, message, related_entity_type || null, related_entity_id || null]
            );

            const alert_id = result.rows[0].alert_id;

            return NextResponse.json({
                success: true,
                message: 'System alert created successfully',
                data: {
                    alert_id,
                    alert_type,
                    severity,
                    title,
                    message,
                    timestamp: new Date().toISOString()
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin create system alert error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create system alert' },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const body = await req.json();
        const {
            alert_id,
            is_resolved = true
        } = body;
        
        const admin_user_id = adminUser.admin_id;

        if (!alert_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: alert_id' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Update alert resolution status
            const updateQuery = `
                UPDATE system_alerts 
                SET is_resolved = $1, 
                    resolved_by = $2, 
                    resolved_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END
                WHERE alert_id = $3
            `;

            const result = await client.query(updateQuery, [is_resolved, admin_user_id, alert_id]);

            if (result.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Alert not found' },
                    { status: 404 }
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Alert ${is_resolved ? 'resolved' : 'marked as unresolved'} successfully`,
                data: {
                    alert_id,
                    is_resolved,
                    resolved_by: admin_user_id,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin resolve system alert error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update alert status' },
            { status: 500 }
        );
    }
}

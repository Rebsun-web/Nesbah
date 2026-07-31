import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import { cascadeDeleteMultipleApplications } from '@/lib/cascade-deletion';
import { validateApplicationStatus } from '@/lib/status-validation';

// GET - Get detailed business user information including application contact details
export async function GET(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { id } = await params;
        console.log(`🔍 Business User API: Fetching details for user ID: ${id}`);
        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_business_[id]_route.jsx_GET');
        
        try {
            // Get detailed business user information including application contact details
            const query = `
                SELECT
                    bu.user_id,
                    bu.cr_national_number,
                    bu.wathiq_data_id,
                    bu.contact_person,
                    bu.contact_person_number,
                    bu.created_at AS bu_created_at,
                    bu.updated_at AS bu_updated_at,
                    -- Wathiq data (canonical source)
                    wd.cr_number,
                    wd.trade_name,
                    wd.legal_form,
                    wd.registration_status,
                    wd.city AS headquarter_city_name,
                    wd.city,
                    wd.headquarter_district_name,
                    wd.headquarter_street_name,
                    wd.headquarter_building_number,
                    wd.issue_date_gregorian,
                    wd.confirmation_date_gregorian,
                    wd.contact_info,
                    wd.activities,
                    wd.has_ecommerce,
                    wd.store_url,
                    wd.cr_capital,
                    wd.cash_capital,
                    wd.management_structure,
                    wd.management_managers,
                    wd.sector,
                    wd.in_kind_capital,
                    wd.avg_capital,
                    wd.is_verified,
                    wd.verification_date,
                    wd.admin_notes,
                    u.email,
                    u.account_status,
                    u.created_at,
                    u.updated_at,
                    -- Application contact information
                    pa.contact_person as application_contact_person,
                    pa.contact_person_number as application_contact_phone,
                    COALESCE(pa.business_contact_email, u.email) as application_contact_email,
                    pa.submitted_at as application_submitted_at,
                    pa.status as application_status,
                    pa.application_id,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.financing_type,
                    pa.city_of_operation,
                    pa.approximate_financing_amount,
                    pa.city_code,
                    pa.sector_code,
                    pa.amount_range_code,
                    pa.business_age_range_code,
                    pa.annual_revenue_code,
                    pa.is_pre_revenue,
                    pa.own_pos_system,
                    pa.lead_score,
                    pa.lead_tier
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                LEFT JOIN pos_application pa ON bu.user_id = pa.user_id
                WHERE bu.user_id = $1
                ORDER BY pa.submitted_at DESC
                LIMIT 1
            `;
            
            const result = await client.query(query, [id]);
            console.log(`🔍 Business User API: Query result for ID ${id}:`, { rowCount: result.rowCount, rows: result.rows });
            
            if (result.rowCount === 0) {
                console.log(`❌ Business User API: No user found with ID ${id}`);
                return NextResponse.json(
                    { success: false, error: 'Business user not found' },
                    { status: 404 }
                );
            }
            
            const userData = result.rows[0];
            
            // Validate and correct application status if application exists
            if (userData.application_id) {
                try {
                    const validationResult = await validateApplicationStatus(
                        userData.application_id, 
                        userData.application_status
                    );
                    
                    // Update the userData with validated status
                    userData.application_status = validationResult.status;
                    userData.calculated_application_status = validationResult.status;
                    userData.status_was_corrected = validationResult.wasCorrected;
                    userData.status_correction_reason = validationResult.reason;
                    
                    if (validationResult.wasCorrected) {
                        console.log(`🔄 Business user API: Status corrected for application ${userData.application_id} from ${validationResult.previousStatus} to ${validationResult.status}`);
                    }
                } catch (error) {
                    console.error(`❌ Error validating application status:`, error);
                    // Continue with original status if validation fails
                    userData.calculated_application_status = userData.application_status;
                }
            } else {
                // No application, set calculated status to null
                userData.calculated_application_status = null;
            }
            
            return NextResponse.json({
                success: true,
                data: userData
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching business user details:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update business user
export async function PUT(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        
        const { 
            // 1.1 Required Data Fields from Wathiq API
            cr_national_number,
            cr_number,
            trade_name,
            legal_form,
            registration_status,
            headquarter_city_name,
            issue_date_gregorian,
            confirmation_date_gregorian,
            contact_info,
            activities,
            has_ecommerce,
            store_url,
            cr_capital,
            cash_capital,
            management_structure,
            management_managers,
            // Additional fields
            address,
            sector,
            in_kind_capital,
            avg_capital,
            headquarter_district_name,
            headquarter_street_name,
            headquarter_building_number,
            city,
            contact_person,
            contact_person_number,
            // User fields
            email,
            account_status
        } = body;

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_business_[id]_route.jsx_PUT');
        
        try {
            await client.query('BEGIN');

            // Check if business user exists
            const existingUser = await client.query(
                `SELECT bu.user_id, u.email FROM business_users bu 
                 JOIN users u ON bu.user_id = u.user_id 
                 WHERE bu.user_id = $1`,
                [id]
            );

            if (existingUser.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Business user not found' },
                    { status: 404 }
                );
            }

            // Update users table if email or account_status changed
            if (email || account_status) {
                const updateUserFields = [];
                const updateUserValues = [];
                let paramCount = 1;

                if (email) {
                    updateUserFields.push(`email = $${paramCount}`);
                    updateUserValues.push(email);
                    paramCount++;
                }

                if (account_status) {
                    updateUserFields.push(`account_status = $${paramCount}`);
                    updateUserValues.push(account_status);
                    paramCount++;
                }

                if (updateUserFields.length > 0) {
                    updateUserFields.push(`updated_at = NOW()`);
                    updateUserValues.push(id);

                    await client.query(
                        `UPDATE users SET ${updateUserFields.join(', ')} WHERE user_id = $${paramCount}`,
                        updateUserValues
                    );
                }
            }

            // Update business_users table
            const updateBusinessFields = [];
            const updateBusinessValues = [];
            let paramCount = 1;

            // Build dynamic update query for business_users
            const businessFields = {
                cr_national_number,
                cr_number,
                trade_name,
                legal_form,
                registration_status,
                headquarter_city_name,
                issue_date_gregorian,
                confirmation_date_gregorian,
                contact_info,
                activities,
                has_ecommerce,
                store_url,
                cr_capital,
                cash_capital,
                management_structure,
                management_managers,
                address,
                sector,
                in_kind_capital,
                avg_capital,
                headquarter_district_name,
                headquarter_street_name,
                headquarter_building_number,
                city,
                contact_person,
                contact_person_number
            };

            for (const [field, value] of Object.entries(businessFields)) {
                if (value !== undefined) {
                    // Clean numeric fields - convert empty strings to null for DECIMAL columns
                    let cleanValue = value;
                    if (['cr_capital', 'cash_capital', 'in_kind_capital', 'avg_capital'].includes(field)) {
                        if (value === '' || value === null || value === undefined) {
                            cleanValue = null;
                        } else if (typeof value === 'string' && value.trim() === '') {
                            cleanValue = null;
                        } else if (isNaN(parseFloat(value))) {
                            cleanValue = null;
                        }
                    }
                    
                    // Only add field if it has a valid value (not undefined)
                    if (cleanValue !== undefined) {
                        updateBusinessFields.push(`${field} = $${paramCount}`);
                        
                        // Handle special data types
                        if (field === 'contact_info' && cleanValue !== null) {
                            updateBusinessValues.push(typeof cleanValue === 'string' ? cleanValue : JSON.stringify(cleanValue));
                        } else if (field === 'activities' && cleanValue !== null) {
                            // Parse comma-separated string into array, or use existing array
                            let activitiesArray;
                            if (Array.isArray(cleanValue)) {
                                activitiesArray = cleanValue;
                            } else if (typeof cleanValue === 'string') {
                                // Split by comma and trim whitespace, filter out empty strings
                                activitiesArray = cleanValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
                            } else {
                                activitiesArray = [cleanValue];
                            }
                            console.log(`🔄 Processing activities field: ${JSON.stringify(cleanValue)} -> ${JSON.stringify(activitiesArray)}`);
                            // Send as PostgreSQL array, not JSON string
                            updateBusinessValues.push(activitiesArray);
                        } else if (field === 'management_managers' && cleanValue !== null) {
                            // Parse comma-separated string into array, or use existing array
                            let managersArray;
                            if (Array.isArray(cleanValue)) {
                                managersArray = cleanValue;
                            } else if (typeof cleanValue === 'string') {
                                // Split by comma and trim whitespace, filter out empty strings
                                managersArray = cleanValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
                            } else {
                                managersArray = [cleanValue];
                            }
                            console.log(`🔄 Processing management_managers field: ${JSON.stringify(cleanValue)} -> ${JSON.stringify(managersArray)}`);
                            // Send as JSON since the database column is jsonb
                            updateBusinessValues.push(JSON.stringify(managersArray));
                        } else {
                            updateBusinessValues.push(cleanValue);
                        }
                        
                        paramCount++;
                    }
                }
            }

            if (updateBusinessFields.length > 0) {
                updateBusinessFields.push(`updated_at = NOW()`);
                updateBusinessValues.push(id);

                console.log(`🔄 Executing UPDATE query with fields: ${updateBusinessFields.join(', ')}`);
                console.log(`🔄 Values to update:`, updateBusinessValues);

                await client.query(
                    `UPDATE business_users SET ${updateBusinessFields.join(', ')} WHERE user_id = $${paramCount}`,
                    updateBusinessValues
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Business user updated successfully',
                data: {
                    user_id: id,
                    updated_fields: Object.keys(businessFields).filter(field => businessFields[field] !== undefined),
                    updated_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database error during business user update:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to update business user' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error updating business user:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete business user and cascade to applications
export async function DELETE(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { id } = await params;

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_business_[id]_route.jsx_DELETE');
        
        try {
            await client.query('BEGIN');

            // Get business user details for logging
            const getUserQuery = 'SELECT user_id, trade_name, cr_national_number FROM business_users WHERE user_id = $1';
            const getUserResult = await client.query(getUserQuery, [id]);
            
            if (getUserResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Business user not found' },
                    { status: 404 }
                );
            }
            
            const userRecord = getUserResult.rows[0];

            // Delete related applications first (cascade delete)
            console.log(`🗑️ Deleting applications for business user ${id}...`);
            
            // Get all application IDs for this business user
            const applicationsResult = await client.query(
                'SELECT application_id FROM pos_application WHERE user_id = $1 OR business_user_id = $1',
                [id]
            );
            
            const applicationIds = applicationsResult.rows.map(row => row.application_id);
            console.log(`🗑️ Found ${applicationIds.length} applications to delete for business user ${id}`);
            
            if (applicationIds.length > 0) {
                try {
                    // Use the cascade deletion utility for multiple applications
                    const deleteResult = await cascadeDeleteMultipleApplications(client, applicationIds);
                    console.log(`🗑️ Cascade deleted ${applicationIds.length} applications: ${deleteResult.totalRecordsDeleted} total records deleted`);
                } catch (err) {
                    console.warn(`⚠️ Warning: Some related records could not be deleted:`, err.message);
                    // Continue with deletion even if some related records fail
                }
            }
            
            // Delete POS applications
            await client.query('DELETE FROM pos_application WHERE user_id = $1 OR business_user_id = $1', [id]);
            
            console.log(`✅ Related applications deleted for business user ${id}`);

            // Delete business user record
            await client.query('DELETE FROM business_users WHERE user_id = $1', [id]);
            
            // Delete user record
            await client.query('DELETE FROM users WHERE user_id = $1', [id]);

            await client.query('COMMIT');
            
            console.log(`✅ Business user ${id} (${userRecord.trade_name}) deleted successfully with cascade`);
            
            return NextResponse.json({
                success: true,
                message: 'Business user deleted successfully with all related applications',
                data: {
                    deleted_user_id: id,
                    trade_name: userRecord.trade_name,
                    cr_national_number: userRecord.cr_national_number,
                    deleted_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database error during business user deletion:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to delete business user' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error deleting business user:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

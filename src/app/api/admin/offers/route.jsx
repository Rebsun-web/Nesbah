import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import pool from '@/lib/db'

export async function POST(request) {
    try {
        // Get admin token from cookies
        const adminToken = request.cookies.get('admin_token')?.value
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 })
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken)
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 })
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id)
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 })
        }

        const { 
            application_id, 
            device_setup_fee, 
            mada_transaction_fee, 
            visa_mc_transaction_fee, 
            mada_settlement_time, 
            offer_comment, 
            admin_notes,
            bank_user_id: providedBankUserId
        } = await request.json()

        if (!application_id) {
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 })
        }

        const client = await pool.connect()
        
        try {
            // Validate that the provided bank_user_id exists and is a bank user
            if (providedBankUserId) {
                const bankUserCheck = await client.query(`
                    SELECT user_id, user_type FROM users WHERE user_id = $1
                `, [providedBankUserId])
                
                if (bankUserCheck.rows.length === 0) {
                    return NextResponse.json({ success: false, error: 'Invalid bank user ID' }, { status: 400 })
                }
                
                if (bankUserCheck.rows[0].user_type !== 'bank_user') {
                    return NextResponse.json({ success: false, error: 'Selected user is not a bank user' }, { status: 400 })
                }
                
                console.log('🔍 Using provided bank user ID:', providedBankUserId)
            } else {
                return NextResponse.json({ success: false, error: 'Bank user ID is required' }, { status: 400 })
            }

            // Check if this bank has already submitted an offer for this application
            const existingOfferCheck = await client.query(`
                SELECT ao.offer_id, ao.status, u.email
                FROM application_offers ao
                JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                JOIN users u ON ao.bank_user_id = u.user_id
                WHERE sa.application_id = $1 AND ao.bank_user_id = $2
            `, [application_id, providedBankUserId])
            
            if (existingOfferCheck.rows.length > 0) {
                const existingOffer = existingOfferCheck.rows[0]
                return NextResponse.json({ 
                    success: false, 
                    error: `Bank ${existingOffer.email} has already submitted an offer for this application. Status: ${existingOffer.status}` 
                }, { status: 400 })
            }

            // Debug: Check if application_offers table exists
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'application_offers'
                )
            `)
            console.log('🔍 application_offers table exists:', tableExists.rows[0].exists)

            // Debug: Check what columns exist in application_offers table
            const columnCheck = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'application_offers'
                ORDER BY ordinal_position
            `)
            console.log('🔍 application_offers table columns:', columnCheck.rows)

            // Check and update status constraint if needed
            console.log('🔍 Checking status constraint...')
            const constraintCheck = await client.query(`
                SELECT conname, pg_get_constraintdef(oid) as definition
                FROM pg_constraint
                WHERE conrelid = 'application_offers'::regclass
                AND contype = 'c'
                AND conname = 'application_offers_status_check'
            `)
            
            if (constraintCheck.rows.length > 0) {
                const constraintDef = constraintCheck.rows[0].definition
                console.log('🔍 Current constraint:', constraintDef)
                
                // Check if 'submitted' is allowed
                if (!constraintDef.includes("'submitted'")) {
                    console.log('🛠️ Updating status check constraint to allow submitted status...')
                    await client.query(`
                        ALTER TABLE application_offers 
                        DROP CONSTRAINT IF EXISTS application_offers_status_check
                    `)
                    
                    await client.query(`
                        ALTER TABLE application_offers 
                        ADD CONSTRAINT application_offers_status_check 
                        CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'expired', 'deal_won', 'deal_lost'))
                    `)
                    console.log('✅ Status constraint updated successfully')
                }
            }

            // Get the submitted_application_id from the application_id
            const applicationQuery = await client.query(
                `SELECT id FROM submitted_applications WHERE application_id = $1`,
                [application_id]
            )

            if (applicationQuery.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
            }

            const submitted_application_id = applicationQuery.rows[0].id

            // Debug: Check what users exist and understand the foreign key relationship
            console.log('🔍 Checking users table...')
            const usersCheck = await client.query(`
                SELECT user_id, email, user_type FROM users LIMIT 5
            `)
            console.log('🔍 Users in database:', usersCheck.rows)
            
            // Check if admin user exists in users table
            const adminUserCheck = await client.query(`
                SELECT user_id, email, user_type FROM users WHERE user_id = $1
            `, [adminUser.admin_id])
            console.log('🔍 Admin user in users table:', adminUserCheck.rows)
            
            // Check the foreign key constraint
            console.log('🔍 Checking foreign key constraint...')
            const fkCheck = await client.query(`
                SELECT 
                    tc.constraint_name, 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name='application_offers'
                AND kcu.column_name = 'bank_user_id'
            `)
            console.log('🔍 Foreign key constraint:', fkCheck.rows)

            // Use the provided bank user ID
            const bank_user_id = providedBankUserId
            console.log('🔍 Using provided bank user ID:', bank_user_id)

            // Insert the offer
            let insertQuery
            try {
                insertQuery = await client.query(
                    `INSERT INTO application_offers (
                        submitted_application_id,
                        bank_user_id,
                        offer_device_setup_fee,
                        offer_transaction_fee_mada,
                        offer_transaction_fee_visa_mc,
                        offer_settlement_time_mada,
                        offer_comment,
                        admin_notes,
                        status,
                        submitted_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                    RETURNING offer_id`,
                    [
                        submitted_application_id,
                        bank_user_id, // Use admin's admin_id as bank_user_id
                        parseFloat(device_setup_fee) || 0,
                        parseFloat(mada_transaction_fee) || 0,
                        parseFloat(visa_mc_transaction_fee) || 0,
                        parseInt(mada_settlement_time) || 24,
                        offer_comment || '',
                        admin_notes || '',
                        'submitted'
                    ]
                )
            } catch (triggerError) {
                // If the trigger fails due to missing bank_partners table, create it and retry
                if (triggerError.message.includes('bank_partners')) {
                    console.log('🛠️ Creating missing bank_partners table...')
                    
                    // Create the missing bank_partners table
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS bank_partners (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER UNIQUE NOT NULL,
                            bank_name VARCHAR(255) NOT NULL,
                            commission_rate DECIMAL(5,2) DEFAULT 0.00,
                            is_active BOOLEAN DEFAULT true,
                            created_at TIMESTAMP DEFAULT NOW(),
                            updated_at TIMESTAMP DEFAULT NOW()
                        )
                    `)
                    
                    // Insert default record for the admin user (use simple INSERT with error handling)
                    try {
                        await client.query(`
                            INSERT INTO bank_partners (user_id, bank_name, commission_rate, is_active)
                            VALUES ($1, 'Admin Bank', 0.00, true)
                        `, [adminUser.admin_id])
                    } catch (insertError) {
                        // If user already exists, that's fine - continue
                        console.log('ℹ️ Admin user already exists in bank_partners')
                    }
                    
                    // Retry the insert
                    insertQuery = await client.query(
                        `INSERT INTO application_offers (
                            submitted_application_id,
                            bank_user_id,
                            offer_device_setup_fee,
                            offer_transaction_fee_mada,
                            offer_transaction_fee_visa_mc,
                            offer_settlement_time_mada,
                            offer_comment,
                            admin_notes,
                            status,
                            submitted_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                        RETURNING offer_id`,
                        [
                            submitted_application_id,
                            bank_user_id,
                            parseFloat(device_setup_fee) || 0,
                            parseFloat(mada_transaction_fee) || 0,
                            parseFloat(visa_mc_transaction_fee) || 0,
                            parseInt(mada_settlement_time) || 24,
                            offer_comment || '',
                            admin_notes || '',
                            'submitted'
                        ]
                    )
                } else {
                    throw triggerError
                }
            }

            // Update the offers count in submitted_applications
            await client.query(
                `UPDATE submitted_applications 
                 SET offers_count = COALESCE(offers_count, 0) + 1
                 WHERE id = $1`,
                [submitted_application_id]
            )

            console.log(`✅ Offer submitted for application ${application_id} by admin ${adminUser.admin_id}`)

            return NextResponse.json({
                success: true,
                message: 'Offer submitted successfully',
                offer_id: insertQuery.rows[0].offer_id
            })
        } finally {
            client.release()
        }

    } catch (error) {
        console.error('Error submitting offer:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        // Get admin token from cookies
        const adminToken = request.cookies.get('admin_token')?.value
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 })
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken)
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 })
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id)
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const application_id = searchParams.get('application_id')

        if (!application_id) {
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 })
        }

        const client = await pool.connect()
        
        try {
            // Get offers for the specific application
            const offersQuery = await client.query(
                `SELECT 
                    ao.offer_id,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc,
                    ao.offer_settlement_time_mada,
                    ao.offer_comment,
                    ao.admin_notes,
                    ao.status,
                    ao.submitted_at,
                    ao.bank_name,
                    ao.bank_contact_person,
                    ao.bank_contact_email,
                    u.email
                 FROM application_offers ao
                 JOIN users u ON ao.bank_user_id = u.user_id
                 JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                 WHERE sa.application_id = $1
                 ORDER BY ao.submitted_at DESC`,
                [application_id]
            )

            return NextResponse.json({
                success: true,
                offers: offersQuery.rows
            })
        } finally {
            client.release()
        }

    } catch (error) {
        console.error('Error fetching offers:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request) {
    const client = await pool.connect()
    
    try {
        const formData = await request.formData()
        
        // Extract form fields
        const leadId = formData.get('leadId')
        const bankUserId = formData.get('bankUserId')
        const approvedAmount = formData.get('approvedAmount')
        const repaymentPeriod = formData.get('repaymentPeriod')
        const interestRate = formData.get('interestRate')
        const monthlyInstallment = formData.get('monthlyInstallment')
        const gracePeriod = formData.get('gracePeriod') || '0'
        const relationshipManagerContact = formData.get('relationshipManagerContact')
        const comment = formData.get('comment')
        
        // Validate required fields
        if (!leadId || !bankUserId || !approvedAmount || !repaymentPeriod || 
            !interestRate || !monthlyInstallment || !relationshipManagerContact) {
            return NextResponse.json({
                success: false,
                message: 'All required fields must be provided',
                details: {
                    leadId: !!leadId,
                    bankUserId: !!bankUserId,
                    approvedAmount: !!approvedAmount,
                    repaymentPeriod: !!repaymentPeriod,
                    interestRate: !!interestRate,
                    monthlyInstallment: !!monthlyInstallment,
                    relationshipManagerContact: !!relationshipManagerContact
                }
            }, { status: 400 })
        }

        // Validate that bankUserId is a valid integer
        const bankUserIdInt = parseInt(bankUserId)
        if (isNaN(bankUserIdInt)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid bank user ID provided'
            }, { status: 400 })
        }

        // Handle file uploads
        const uploadedFiles = []
        const supportingDocuments = formData.getAll('supportingDocuments')
        
        if (supportingDocuments && supportingDocuments.length > 0) {
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'bank-offers', leadId)
            
            // Create directory if it doesn't exist
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true })
            }

            for (let i = 0; i < supportingDocuments.length; i++) {
                const file = supportingDocuments[i]
                
                if (file && file.size > 0) {
                    // Validate file size (10MB limit)
                    if (file.size > 10 * 1024 * 1024) {
                        return NextResponse.json({
                            success: false,
                            message: `File ${file.name} exceeds 10MB limit`
                        }, { status: 400 })
                    }

                    // Validate file type
                    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png']
                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    
                    if (!allowedTypes.includes(fileExtension)) {
                        return NextResponse.json({
                            success: false,
                            message: `File type ${fileExtension} is not allowed`
                        }, { status: 400 })
                    }

                    // Generate unique filename
                    const timestamp = Date.now()
                    const uniqueFilename = `${timestamp}_${file.name}`
                    const filePath = join(uploadDir, uniqueFilename)
                    
                    // Convert file to buffer and save
                    const bytes = await file.arrayBuffer()
                    const buffer = Buffer.from(bytes)
                    await writeFile(filePath, buffer)
                    
                    uploadedFiles.push({
                        originalName: file.name,
                        filename: uniqueFilename,
                        path: `/uploads/bank-offers/${leadId}/${uniqueFilename}`,
                        size: file.size,
                        type: file.type
                    })
                }
            }
        }

        // Start transaction
        await client.query('BEGIN')

        console.log(`🔧 Starting offer submission for lead ${leadId} by bank user ${bankUserIdInt}`)

        // 1. Insert the offer into application_offers table
        const offerInsertQuery = `
            INSERT INTO application_offers (
                submitted_application_id,
                bank_user_id,
                submitted_by_user_id,
                offer_comment,
                offer_terms,
                offer_validity_days,
                bank_contact_person,
                bank_contact_email,
                bank_contact_phone,
                deal_value,
                status,
                submitted_at,
                expires_at,
                uploaded_filename,
                uploaded_mimetype
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING offer_id
        `

        const offerValues = [
            leadId,
            bankUserIdInt,
            bankUserIdInt, // submitted_by_user_id is the same as bank_user_id for bank offers
            comment || '',
            `Approved Amount: ${approvedAmount}, Repayment Period: ${repaymentPeriod} months, Interest Rate: ${interestRate}%, Monthly Installment: ${monthlyInstallment}, Grace Period: ${gracePeriod} months`,
            30, // 30 days validity
            relationshipManagerContact,
            '', // Will be extracted from relationshipManagerContact if needed
            '', // Will be extracted from relationshipManagerContact if needed
            parseFloat(approvedAmount),
            'submitted',
            new Date().toISOString(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            uploadedFiles.length > 0 ? uploadedFiles[0].filename : null,
            uploadedFiles.length > 0 ? uploadedFiles[0].type : null
        ]

        const offerResult = await client.query(offerInsertQuery, offerValues)
        const offerId = offerResult.rows[0].offer_id

        console.log(`✅ Offer ${offerId} inserted successfully for lead ${leadId}`)
        console.log(`📊 Offer details: bank_user_id=${bankUserIdInt}, submitted_by_user_id=${bankUserIdInt}`)

        // 2. Update the offers_count in pos_application table
        const updateOffersCountQuery = `
            UPDATE pos_application 
            SET 
                offers_count = COALESCE(offers_count, 0) + 1,
                purchased_by = CASE 
                    WHEN purchased_by IS NULL OR array_length(purchased_by, 1) IS NULL THEN ARRAY[$1::INTEGER]
                    ELSE purchased_by || ARRAY[$1::INTEGER]
                END
            WHERE application_id = $2
        `

        await client.query(updateOffersCountQuery, [bankUserIdInt, leadId])

        console.log(`✅ Updated offers_count and purchased_by for lead ${leadId}`)

        // Verify the update was successful
        const verifyResult = await client.query(
            'SELECT offers_count, purchased_by FROM pos_application WHERE application_id = $1',
            [leadId]
        )
        
        if (verifyResult.rows.length > 0) {
            const app = verifyResult.rows[0]
            console.log(`🔍 Verification: lead ${leadId} now has offers_count=${app.offers_count}, purchased_by=[${app.purchased_by}]`)
        }

        // 3. Commit transaction
        await client.query('COMMIT')

        const offerData = {
            offerId,
            leadId,
            bankUserId,
            approvedAmount: parseFloat(approvedAmount),
            repaymentPeriod: parseInt(repaymentPeriod),
            interestRate: parseFloat(interestRate),
            monthlyInstallment: parseFloat(monthlyInstallment),
            gracePeriod: parseInt(gracePeriod),
            relationshipManagerContact,
            comment: comment || '',
            supportingDocuments: uploadedFiles,
            submittedAt: new Date().toISOString(),
            status: 'submitted',
            productType: 'posFinancing'
        }

        console.log('POS Financing offer submitted successfully:', offerData)

        return NextResponse.json({
            success: true,
            message: 'Offer submitted successfully',
            data: offerData
        })

    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK')
        console.error('Error submitting POS Financing offer:', error)
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 })
    } finally {
        client.release()
    }
}

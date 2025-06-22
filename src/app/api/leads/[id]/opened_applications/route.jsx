import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req) {
    try {
        const { application_id, bank_user_id } = await req.json()

        if (!application_id || !bank_user_id) {
            return NextResponse.json(
                { success: false, error: 'Missing application id or bank user' },
                { status: 400 }
            )
        }

        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Step 1: Add bank_user_id to opened_by (if not already there)
            await client.query(
                `
        UPDATE submitted_applications
        SET opened_by = (
          CASE
            WHEN NOT $2 = ANY(opened_by)
              THEN array_append(opened_by, $2)
            ELSE opened_by
          END
        ),
        status = 'open'
        WHERE application_id = $1
        `,
                [application_id, bank_user_id]
            )

            await client.query('COMMIT')
            return NextResponse.json({ success: true })
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('Failed to update opened_by:', err)
            return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 })
        } finally {
            client.release()
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
    }
}

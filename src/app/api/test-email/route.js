import { NextResponse } from 'next/server'
import { sendNewsletterSubscriptionEmail } from '@/lib/email/serverEmailNotifications'

export async function POST(request) {
    try {
        const { testEmail } = await request.json()
        
        if (!testEmail) {
            return NextResponse.json({
                success: false,
                error: 'Test email address is required'
            }, { status: 400 })
        }

        // Send a test email
        const result = await sendNewsletterSubscriptionEmail(testEmail)
        
        return NextResponse.json({
            success: true,
            message: 'Test email sent successfully',
            result
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Email test endpoint ready. Send POST request with testEmail in body.',
        config: {
            serviceId: process.env.EMAILJS_SERVICE_ID,
            notificationsEnabled: process.env.DISABLE_EMAIL_NOTIFICATIONS !== 'true',
            contactEmail: 'devadmin@nesbah.com.sa'
        }
    })
}

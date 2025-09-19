import { NextResponse } from 'next/server'
import { getEmailNotificationStatus } from '@/lib/email/serverEmailNotifications'

export async function GET() {
    try {
        const status = getEmailNotificationStatus()
        
        const config = {
            serviceId: process.env.EMAILJS_SERVICE_ID,
            publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'not configured',
            privateKey: process.env.EMAILJS_PRIVATE_KEY ? '***configured***' : 'not configured',
            notificationsEnabled: !status.disabled,
            templates: {
                newsletter: process.env.EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID,
                businessRegistration: process.env.EMAILJS_BUSINESS_REGISTRATION_TEMPLATE_ID,
                applicationSubmitted: process.env.EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID,
                auctionExpiration: process.env.EMAILJS_AUCTION_EXPIRATION_TEMPLATE_ID,
                newApplicationLead: process.env.EMAILJS_NEW_APPLICATION_LEAD_TEMPLATE_ID
            },
            contactEmail: 'devadmin@nesbah.com.sa',
            timestamp: new Date().toISOString()
        }

        return NextResponse.json({
            success: true,
            status,
            config
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

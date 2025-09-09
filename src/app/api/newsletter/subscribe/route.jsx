import { NextResponse } from 'next/server';
import { sendNewsletterSubscriptionEmail } from '@/lib/email/emailNotifications';

export async function POST(req) {
    try {
        const body = await req.json();
        const { email } = body;

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'Valid email address is required' },
                { status: 400 }
            );
        }

        // Send newsletter subscription confirmation email
        try {
            const emailResult = await sendNewsletterSubscriptionEmail(email);
            
            if (emailResult.success) {
                console.log(`✅ Newsletter subscription confirmation sent to ${email}`);
                return NextResponse.json({
                    success: true,
                    message: 'Newsletter subscription successful. Please check your email for confirmation.',
                    email: email
                });
            } else {
                console.error(`❌ Failed to send newsletter subscription email to ${email}:`, emailResult.error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to send confirmation email. Please try again.'
                }, { status: 500 });
            }
        } catch (emailError) {
            console.error(`❌ Newsletter subscription email error for ${email}:`, emailError);
            return NextResponse.json({
                success: false,
                error: 'Failed to send confirmation email. Please try again.'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

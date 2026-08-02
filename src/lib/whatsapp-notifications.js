/**
 * WhatsApp notifications via CallMeBot free API
 *
 * Setup (one-time, per phone number):
 *   1. Add +1 (206) 337-7016 to your WhatsApp contacts as "CallMeBot"
 *   2. Send: "I allow callmebot to send me messages"
 *   3. You receive an API key back — save it as ADMIN_WHATSAPP_APIKEY
 *   4. Set ADMIN_WHATSAPP_PHONE to your number in international format (e.g. +966501234567)
 *
 * Rate limit: ~100 messages/day on the free tier.
 */

import { formatFinancingType } from '@/lib/apply-options';

/**
 * Send a WhatsApp message to the admin when a new lead is submitted.
 * Fire-and-forget — never throws, never blocks the request.
 */
export async function sendAdminWhatsAppAlert(applicationData) {
    const phone = process.env.ADMIN_WHATSAPP_PHONE;
    const apiKey = process.env.ADMIN_WHATSAPP_APIKEY;

    if (!phone || !apiKey) return;

    const text = [
        `🔔 New Nesbah Lead`,
        `Ref: ${applicationData.reference_number}`,
        `Type: ${formatFinancingType(applicationData.financing_type, 'ar')}`,
        `Business: ${applicationData.business_name || 'Unknown'}`,
        `Contact: ${applicationData.contact_person} — ${applicationData.contact_person_number}`,
        `City: ${applicationData.city_of_operation || 'Not specified'}`,
    ].join('\n');

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`❌ WhatsApp alert failed: HTTP ${res.status}`);
        } else {
            console.log(`✅ WhatsApp admin alert sent to ${phone}`);
        }
    } catch (err) {
        console.error(`❌ WhatsApp alert error:`, err.message);
    }
}

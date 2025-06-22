import emailjs from '@emailjs/nodejs'

emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

export async function sendNewLeadEmail(toEmail) {
    try {
        console.log(`📤 Attempting to send email to ${toEmail}`);
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            {
                to_email: toEmail,
            }
        );
        console.log(`✅ Email sent to ${toEmail}. Response:`, response);
    } catch (error) {
        console.error(`❌ Failed to send email to ${toEmail}. Error:`, error);
    }
}
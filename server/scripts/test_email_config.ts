import dotenv from 'dotenv';
import { sendEmail } from '../src/services/email';
import path from 'path';

// Load environment variables from server/.env
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function testEmail() {
    console.log('Starting Email Test...');
    console.log('API Key configured:', !!process.env.BREVO_API_KEY);
    console.log('From Email:', process.env.BREVO_FROM_EMAIL);

    // User's email or a test email. Assuming we want to test if it WORKS.
    // I'll use a dummy receiver or if the user provided one.
    // Ideally I'd use the FROM email as the TO email to test loopback.
    const testTo = process.env.BREVO_FROM_EMAIL;

    if (!testTo) {
        console.error('No BREVO_FROM_EMAIL defined, cannot run test.');
        return;
    }

    console.log(`Attempting to send test email to ${testTo}...`);

    const result = await sendEmail(
        testTo,
        'Test Email from Jersey System',
        '<h1>It Works!</h1><p>This is a test email to verify configuration.</p>',
        'It Works! This is a test email to verify configuration.'
    );

    if (result.success) {
        console.log('✅ Test Email Sent Successfully!');
    } else {
        console.error('❌ Test Email Failed.');
    }
}

testEmail().catch(err => console.error('Script Error:', err));

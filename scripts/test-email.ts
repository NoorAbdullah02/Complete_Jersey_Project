
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

import { sendEmail } from '../server/src/services/email';

async function test() {
    console.log('Testing Email Service...');
    console.log('API Key:', process.env.BREVO_API_KEY ? 'Present' : 'Missing');
    console.log('From Email:', process.env.BREVO_FROM_EMAIL);
    
    const res = await sendEmail(
        'sheikhnoorabdullah02@gmail.com',
        'Test Email',
        '<h1>Test</h1>',
        'Test'
    );
    
    console.log('Result:', res);
}

test();

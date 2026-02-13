
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAuthFlow() {
    console.log('--- AUTH FLOW SIMULATION ---');

    const username = 'imran';
    const password = '12345678';
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    console.log(`Using JWT_SECRET: ${secret === 'fallback-secret' ? 'FALLBACK' : 'FROM_ENV'}`);

    // 1. Simulate finding user (we know they exist and match)
    // We'll just generate a token as if login succeeded
    console.log('\n1. Generating Token (Simulating Login)...');
    try {
        const token = jwt.sign(
            { id: 1, username: username },
            secret,
            { expiresIn: '15m' }
        );
        console.log('Token generated successfully.');

        // 2. Simulate verification (Simulating authenticateToken middleware)
        console.log('\n2. Verifying Token (Simulating /verify)...');
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                console.error('VERIFICATION FAILED:', err.message);
                if (err.name === 'JsonWebTokenError') {
                    console.log('Possible cause: Secret mismatch or malformed token.');
                }
            } else {
                console.log('VERIFICATION SUCCESSFUL!');
                console.log('Decoded Payload:', decoded);
            }
        });

    } catch (error) {
        console.error('Login simulation failed:', error.message);
    }
}

testAuthFlow();

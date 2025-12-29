const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log('Using API Key:', process.env.RESEND_API_KEY ? 'Present (starts with ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'MISSING');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Voicelo <notifications@info.voicelo.app>',
            to: ['bunter96@gmail.com'], // Using a likely email based on path, or just a placeholder
            subject: 'Test Email from Voicelo',
            html: '<h1>Test Successful</h1><p>If you see this, your Resend configuration is working correctly.</p>'
        });

        if (error) {
            console.error('Resend Error:', error);
        } else {
            console.log('Resend Success!', data);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testEmail();

import nodemailer from 'nodemailer';

// Zoho Mail SMTP Configuration
// Required environment variables:
// ZOHO_MAIL_USER=support@voicelo.app
// ZOHO_MAIL_PASSWORD=your_app_specific_password (NOT your account password!)
// ZOHO_REGION=us (optional: us, eu, in, au, jp - defaults to us)

// Zoho SMTP hosts by region
// IMPORTANT: For organization/paid accounts with custom domains, use smtppro.*
// For personal @zohomail.com addresses, use smtp.* (set ZOHO_ACCOUNT_TYPE=personal)
const getZohoHost = () => {
    const region = (process.env.ZOHO_REGION || 'us').toLowerCase();
    const accountType = (process.env.ZOHO_ACCOUNT_TYPE || 'organization').toLowerCase();

    // Use smtppro for organization accounts (custom domains), smtp for personal
    const prefix = accountType === 'personal' ? 'smtp' : 'smtppro';

    const hosts: Record<string, string> = {
        'us': `${prefix}.zoho.com`,
        'eu': `${prefix}.zoho.eu`,
        'in': `${prefix}.zoho.in`,
        'au': `${prefix}.zoho.com.au`,
        'jp': `${prefix}.zoho.jp`,
    };

    return hosts[region] || hosts['us'];
};

// Create transporter lazily to avoid issues at build time
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: getZohoHost(),
            port: 465,
            secure: true, // SSL
            auth: {
                user: process.env.ZOHO_MAIL_USER || 'support@voicelo.app',
                pass: process.env.ZOHO_MAIL_PASSWORD,
            },
        });
    }
    return transporter;
};

export interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
}

export async function sendZohoEmail(options: SendEmailOptions) {
    if (!process.env.ZOHO_MAIL_PASSWORD) {
        console.error('ZOHO_MAIL_PASSWORD is missing in environment variables');
        throw new Error('Email configuration error: ZOHO_MAIL_PASSWORD is required');
    }

    if (!process.env.ZOHO_MAIL_USER) {
        console.error('ZOHO_MAIL_USER is missing in environment variables');
        throw new Error('Email configuration error: ZOHO_MAIL_USER is required');
    }

    const mailOptions = {
        from: `Voicelo Support <${process.env.ZOHO_MAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
    };

    try {
        const transport = getTransporter();
        const info = await transport.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Failed to send email via Zoho:', error.message);

        // Provide helpful error messages
        if (error.message.includes('535') || error.message.includes('Authentication')) {
            console.error(`
=== ZOHO MAIL AUTHENTICATION TROUBLESHOOTING ===
1. Make sure you're using an APP-SPECIFIC PASSWORD, not your account password
   - Go to: accounts.zoho.com → Security → App Passwords → Generate New
   
2. Check your Zoho region matches your account:
   - US: smtp.zoho.com (default)
   - EU: smtp.zoho.eu (set ZOHO_REGION=eu)
   - India: smtp.zoho.in (set ZOHO_REGION=in)
   
3. Verify the email address in ZOHO_MAIL_USER is correct

Current config:
- Host: ${getZohoHost()}
- User: ${process.env.ZOHO_MAIL_USER}
================================================
            `);
        }

        throw new Error(error.message || 'Failed to send email');
    }
}

export default getTransporter;


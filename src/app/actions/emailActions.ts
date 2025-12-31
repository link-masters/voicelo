'use server'

import * as React from 'react';
import { render } from '@react-email/render';
import { resend } from '@/lib/resend';
import WelcomeEmail from '@/emails/WelcomeEmail';
import VerifyEmail from '@/emails/VerifyEmail';
import { createAdminClient } from '@/lib/appwrite-server';
import crypto from 'crypto';

/**
 * Sends a welcome email to a new user.
 */
export async function sendWelcomeEmail(email: string, userName: string) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('ERROR: RESEND_API_KEY is missing');
            return { success: false, error: 'API key missing' };
        }

        const sender = 'Voicelo <notifications@info.voicelo.app>';

        // Use React.createElement to keep file as .ts
        const emailHtml = await render(React.createElement(WelcomeEmail, { userName }));

        const { data, error } = await resend.emails.send({
            from: sender,
            to: [email],
            subject: 'Welcome to Voicelo! 🎙️',
            text: `Welcome to Voicelo, ${userName || 'there'}! We're thrilled to have you join our community of creators. Visit your dashboard at https://voicelo.app/dashboard`,
            html: emailHtml,
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Unexpected error in sendWelcomeEmail:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Checks if welcome email was sent and sends it if not.
 */
export async function ensureWelcomeEmailSent(userId: string, email: string, name: string) {
    try {
        const { users } = createAdminClient();
        const user = await users.get(userId);

        if (user.prefs.welcomeEmailSent) {
            return { success: true, alreadySent: true };
        }

        if (!email) {
            return { success: false, error: 'No email found' };
        }

        const result = await sendWelcomeEmail(email, name || 'there');

        if (result.success) {
            await users.updatePrefs(userId, {
                ...user.prefs,
                welcomeEmailSent: true,
                welcomeEmailSentDate: new Date().toISOString()
            });
        }

        return result;
    } catch (error: any) {
        console.error('Error in ensureWelcomeEmailSent:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a custom verification email via Resend.
 */
export async function sendVerificationEmail(userId: string, email: string, name: string, baseUrl: string = 'https://voicelo.app') {
    try {
        const { users } = createAdminClient();
        const user = await users.get(userId);

        if (user.emailVerification) {
            return { success: true, alreadyVerified: true };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const currentPrefs = user.prefs || {};
        const updatedPrefs = {
            ...currentPrefs,
            verificationToken: token,
            verificationTokenExpires: expires
        };

        // Update with token first
        await users.updatePrefs(userId, updatedPrefs);

        const verificationUrl = `${baseUrl}/verify-email?userId=${userId}&token=${token}`;

        // Use React.createElement to keep file as .ts
        const emailHtml = await render(React.createElement(VerifyEmail, { userName: name, verificationUrl }));

        const { data, error } = await resend.emails.send({
            from: 'Voicelo <notifications@info.voicelo.app>',
            to: [email],
            subject: 'Verify your Voicelo account',
            text: `Please verify your Voicelo account by visiting: ${verificationUrl}`,
            html: emailHtml,
        });

        if (error) {
            console.error('Resend verification error:', error);
            return { success: false, error: error.message };
        }

        // Mark as sent in user preferences via Admin SDK, preserving the token
        await users.updatePrefs(userId, {
            ...updatedPrefs,
            verificationEmailSent: true,
            verificationEmailSentDate: new Date().toISOString()
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('sendVerificationEmail error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Validates a verification token and updates user status in Appwrite.
 */
export async function verifyUserToken(userId: string, token: string) {
    try {
        const { users } = createAdminClient();
        const user = await users.get(userId);

        const storedToken = user.prefs.verificationToken;
        const expires = user.prefs.verificationTokenExpires;

        if (!storedToken || storedToken !== token) {
            throw new Error('Invalid or expired verification link.');
        }

        if (expires && new Date(expires) < new Date()) {
            throw new Error('Verification link has expired.');
        }

        await users.updateEmailVerification(userId, true);

        const updatedPrefs = { ...user.prefs };
        delete updatedPrefs.verificationToken;
        delete updatedPrefs.verificationTokenExpires;

        await users.updatePrefs(userId, updatedPrefs);

        return { success: true };
    } catch (error: any) {
        console.error('verifyUserToken error:', error);
        return { success: false, error: error.message };
    }
}

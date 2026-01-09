
import { NextRequest, NextResponse } from 'next/server';
import * as React from 'react';
import { render } from '@react-email/render';
import { resend } from '@/lib/resend';
import ContactConfirmationEmail from '@/emails/ContactConfirmationEmail';

interface ContactFormData {
    name: string;
    email: string;
    queryType: 'General Query' | 'Feature Request' | 'Refund Request';
    description: string;
}

// Support email - where contact form submissions are sent
const SUPPORT_EMAIL = 'support@voicelo.app';
// Sender email - must be a verified domain in Resend
const SENDER_EMAIL = 'Voicelo Support <notifications@info.voicelo.app>';

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json();

        // Validate required fields
        if (!body.name || !body.email || !body.queryType || !body.description) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Validate description length
        if (body.description.length > 1000) {
            return NextResponse.json(
                { error: 'Description must not exceed 1000 characters' },
                { status: 400 }
            );
        }

        // Validate query type
        const validQueryTypes = ['General Query', 'Feature Request', 'Refund Request'];
        if (!validQueryTypes.includes(body.queryType)) {
            return NextResponse.json(
                { error: 'Invalid query type' },
                { status: 400 }
            );
        }

        // Send notification to support team (internal)
        const supportEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Contact Form Submission</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${body.name}</p>
                    <p><strong>Email:</strong> ${body.email}</p>
                    <p><strong>Query Type:</strong> ${body.queryType}</p>
                    <p><strong>Description:</strong></p>
                    <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                        ${body.description.replace(/\n/g, '<br/>')}
                    </div>
                </div>
                <p style="color: #666; font-size: 14px;">Reply to this email to respond directly to the customer.</p>
            </div>
        `;

        // Send to support team
        const { error: supportEmailError } = await resend.emails.send({
            from: SENDER_EMAIL,
            to: [SUPPORT_EMAIL],
            replyTo: body.email,
            subject: `[${body.queryType}] New Contact from ${body.name}`,
            text: `New contact form submission:\n\nName: ${body.name}\nEmail: ${body.email}\nQuery Type: ${body.queryType}\nDescription: ${body.description}`,
            html: supportEmailHtml,
        });

        if (supportEmailError) {
            console.error('Failed to send support notification:', supportEmailError);
            throw new Error('Failed to send contact form');
        }

        // Send confirmation email to user
        const confirmationEmailHtml = await render(
            React.createElement(ContactConfirmationEmail, {
                userName: body.name,
                queryType: body.queryType,
            })
        );

        const { error: confirmationEmailError } = await resend.emails.send({
            from: SENDER_EMAIL,
            to: [body.email],
            subject: `We received your ${body.queryType.toLowerCase()} - Voicelo Support`,
            text: `Hi ${body.name},\n\nThank you for reaching out! We have received your ${body.queryType.toLowerCase()} and will get back to you soon.\n\nBest regards,\nThe Voicelo Support Team`,
            html: confirmationEmailHtml,
        });

        if (confirmationEmailError) {
            console.error('Failed to send confirmation email:', confirmationEmailError);
            // Don't fail the request if confirmation email fails - the support already got the message
        }

        return NextResponse.json(
            { success: true, message: 'Your message has been sent successfully!' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message. Please try again later.' },
            { status: 500 }
        );
    }
}


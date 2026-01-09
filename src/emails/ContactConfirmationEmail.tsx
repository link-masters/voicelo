import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Link,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ContactConfirmationEmailProps {
    userName: string;
    queryType: string;
}

export const ContactConfirmationEmail = ({ userName, queryType }: ContactConfirmationEmailProps) => {
    const previewText = `We received your ${queryType.toLowerCase()} - Voicelo Support`;

    const getResponseMessage = () => {
        switch (queryType) {
            case 'Refund Request':
                return 'Our support team will review your refund request and get back to you within 2-3 business days.';
            case 'Feature Request':
                return 'We love hearing your ideas! Our product team will review your suggestion and we may reach out for more details.';
            default:
                return 'Our support team will review your inquiry and respond as soon as possible, typically within 24-48 hours.';
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-[580px]">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-bold text-gray-800 mb-4">
                                We Received Your Message 📬
                            </Heading>
                            <Text className="text-gray-600 text-lg leading-7 mb-4">
                                Hi {userName || "there"},
                            </Text>
                            <Text className="text-gray-600 text-lg leading-7 mb-4">
                                Thank you for reaching out to us! This email confirms that we have received your <strong>{queryType.toLowerCase()}</strong>.
                            </Text>
                            <Text className="text-gray-600 text-lg leading-7 mb-4">
                                {getResponseMessage()}
                            </Text>
                            <Section className="my-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <Text className="text-gray-600 text-base leading-7 m-0">
                                    <strong>Query Type:</strong> {queryType}
                                </Text>
                            </Section>
                            <Hr className="border-gray-200 my-8" />
                            <Text className="text-gray-500 text-sm leading-6">
                                If you have any additional information to share, feel free to reply to this email.
                            </Text>
                            <Text className="text-gray-500 text-sm leading-6">
                                Best regards,<br />
                                The Voicelo Support Team
                            </Text>
                        </Section>
                        <Section className="text-center">
                            <Link
                                href="https://voicelo.app"
                                className="text-gray-400 text-xs underline"
                            >
                                voicelo.app
                            </Link>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ContactConfirmationEmail;

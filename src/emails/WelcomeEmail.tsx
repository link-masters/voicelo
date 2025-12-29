import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Button,
    Hr,
    Link,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    userName?: string;
}

export const WelcomeEmail = ({ userName }: WelcomeEmailProps) => {
    const previewText = `Welcome to Voicelo, ${userName || 'there'}!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-[580px]">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-bold text-gray-800 mb-4">
                                Welcome to Voicelo! 🎙️
                            </Heading>
                            <Text className="text-gray-600 text-lg leading-7 mb-4">
                                Hi {userName || "there"},
                            </Text>
                            <Text className="text-gray-600 text-lg leading-7 mb-4">
                                We're thrilled to have you join our community of creators. Voicelo is designed to help you transform your text into lifelike speech with the power of advanced AI.
                            </Text>
                            <Section className="my-8 text-center">
                                <Button
                                    className="bg-indigo-600 rounded text-white text-[16px] font-semibold no-underline text-center px-6 py-3"
                                    href="https://voicelo.app/dashboard"
                                >
                                    Go to Dashboard
                                </Button>
                            </Section>
                            <Text className="text-gray-600 text-lg leading-7">
                                Here's what you can do right now:
                            </Text>
                            <ul className="list-disc ml-6 text-gray-600 text-lg leading-7 mb-6">
                                <li>Create high-quality AI voiceovers</li>
                                <li>Clone your own voice for personalized content</li>
                                <li>Explore our library of community-shared voices</li>
                                <li>Join our influencer program to earn credits</li>
                            </ul>
                            <Hr className="border-gray-200 my-8" />
                            <Text className="text-gray-500 text-sm leading-6">
                                If you have any questions, feel free to reply to this email. We're here to help!
                            </Text>
                            <Text className="text-gray-500 text-sm leading-6">
                                Best regards,<br />
                                The Voicelo Team
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
        </Html >
    );
};

export default WelcomeEmail;

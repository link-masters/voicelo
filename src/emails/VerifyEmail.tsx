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
    Link,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
    userName?: string;
    verificationUrl?: string;
}

export const VerifyEmail = ({ userName, verificationUrl }: VerifyEmailProps) => {
    const previewText = "Verify your Voicelo account";

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-[#f9fafb] font-sans py-12 px-4">
                    <Container className="bg-white border border-gray-100 rounded-xl mx-auto p-8 max-w-[480px] shadow-sm">
                        <Section className="mb-8">
                            <Heading className="text-xl font-bold text-gray-900 mb-6 text-center">
                                Verify your email
                            </Heading>
                            <Text className="text-gray-600 text-[15px] leading-6 mb-4">
                                Hi {userName || "there"},
                            </Text>
                            <Text className="text-gray-600 text-[15px] leading-6 mb-8">
                                Thanks for joining Voicelo! To get started and secure your account, please verify your email address by clicking the button below.
                            </Text>
                            <Section className="text-center mb-8">
                                <Button
                                    className="bg-blue-600 rounded-lg text-white text-[14px] font-medium no-underline text-center px-10 py-3.5"
                                    href={verificationUrl}
                                >
                                    Verify Email
                                </Button>
                            </Section>
                            <Text className="text-gray-500 text-[13px] leading-5 text-center">
                                Or copy and paste this link into your browser:
                            </Text>
                            <Text className="text-blue-600 text-[13px] leading-5 text-center break-all px-4">
                                <Link href={verificationUrl} className="text-blue-600 underline">
                                    {verificationUrl}
                                </Link>
                            </Text>
                        </Section>
                        <Section className="border-t border-gray-100 pt-6 mt-8">
                            <Text className="text-gray-400 text-[12px] text-center">
                                If you didn't create an account on Voicelo, you can safely ignore this email.
                            </Text>
                        </Section>
                    </Container>
                    <Section className="text-center mt-6">
                        <Text className="text-gray-400 text-[12px]">
                            © {new Date().getFullYear()} Voicelo. All rights reserved.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default VerifyEmail;

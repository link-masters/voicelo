import { Metadata } from "next";
import { ContactContent } from "@/components/ContactContent";

export const metadata: Metadata = {
    title: "Contact Us - Support & Inquiries",
    description: "Get in touch with VoiceLo for support, feature requests, or general inquiries. We're here to help you amplify your content.",
    openGraph: {
        title: "Contact VoiceLo - Support & Inquiries",
        description: "Get in touch with VoiceLo for support, feature requests, or general inquiries. We're here to help you amplify your content.",
    }
};

export default function ContactPage() {
    return <ContactContent />;
}

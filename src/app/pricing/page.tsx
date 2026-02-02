import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PricingContent } from "@/components/pricing/PricingPageContent";

export const metadata: Metadata = {
    title: "Pricing - Affordable AI Voice Credits",
    description: "Choose the perfect AI voice credit package for your needs. Affordable pricing for high-quality text-to-speech and voice cloning.",
    openGraph: {
        title: "VoiceLo Pricing - Affordable AI Voice Credits",
        description: "Choose the perfect AI voice credit package for your needs. Affordable pricing for high-quality text-to-speech and voice cloning.",
    }
};

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    );
}

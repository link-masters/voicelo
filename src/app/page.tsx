import { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/LandingPageContent";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicelo.com";

export const metadata: Metadata = {
  title: "VoiceLo - AI Voice Generator & Text-to-Speech Platform",
  description: "Create studio-quality AI voices in seconds. VoiceLo offers professional text-to-speech with 50+ premium voices in 15+ native languages, plus instant voice cloning.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "VoiceLo - Professional AI Voice Generator",
    description: "Transform text into studio-quality speech with 15+ native languages and instant voice cloning.",
    url: siteUrl,
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "VoiceLo",
    "url": siteUrl,
    "description": "High-quality AI Voice Generator & Text-to-Speech platform with 15+ native languages and instant voice cloning.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "VoiceLo"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageContent />
    </>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieConsent from "../components/CookieConsent";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { VoiceProvider } from "../context/VoiceContext";
import { NotificationProvider } from "../context/NotificationContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicelo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VoiceLo - High Quality AI Voice Generator",
    template: "%s | VoiceLo"
  },
  description: "Text To Speech AI Voice generator with premium voices in 15+ different native languages with custom instant voice cloning.",
  keywords: ["AI Voice", "Text to Speech", "Voice Cloning", "AI Speech Generator", "Professional AI Voices"],
  authors: [{ name: "VoiceLo Team" }],
  creator: "VoiceLo",
  publisher: "VoiceLo",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "VoiceLo",
    title: "VoiceLo - Professional AI Voice Generator",
    description: "Transform text into studio-quality speech with 15+ native languages and instant voice cloning.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VoiceLo - AI Voice Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceLo - Professional AI Voice Generator",
    description: "Transform text into studio-quality speech with 15+ native languages and instant voice cloning.",
    images: ["/og-image.png"],
    creator: "@Voiceloofficial",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <NotificationProvider>
            <VoiceProvider>
              <ThemeProvider>
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <CookieConsent />
                <Analytics />
              </ThemeProvider>
            </VoiceProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

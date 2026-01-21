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

export const metadata: Metadata = {
  title: "VoiceLo - High Quality AI Voice Generator",
  description: "Text To Speech AI Voice generator with premium voices in 15+ different native languages with custom instant voice cloning.",
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

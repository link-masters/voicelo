import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { VoiceProvider } from "../context/VoiceContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SonicFlow - Modern TTS",
  description: "Next-generation Text to Speech Interface",
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
          <VoiceProvider>
            <ThemeProvider>
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </ThemeProvider>
          </VoiceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProviderName } from "@/config/payment";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans text-base leading-relaxed">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
                    <div className="space-y-16">
                        <header className="space-y-4">
                            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
                            <p className="text-muted-foreground text-lg">Last Updated: December 28, 2025</p>
                        </header>

                        <div className="space-y-12">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
                                <p className="text-muted-foreground">
                                    Welcome to VoiceLo ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we process and safeguard your data when you use our Text-to-Speech platform.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
                                <p className="text-muted-foreground">
                                    We collect information that you provide directly to us when you create an account, make a purchase, or communicate with us. This includes:
                                </p>
                                <ul className="space-y-6 text-muted-foreground">
                                    <li className="space-y-2">
                                        <div className="flex gap-3">
                                            <span className="font-bold text-foreground">(a)</span>
                                            <strong className="text-foreground">Account Information</strong>
                                        </div>
                                        <div className="pl-10">
                                            <ul className="list-disc space-y-2 marker:text-foreground">
                                                <li>Name</li>
                                                <li>Email address</li>
                                                <li>
                                                    Authentication credentials via Appwrite Cloud, including:
                                                    <ul className="pl-5 mt-1 list-[circle] space-y-1">
                                                        <li>Email/Password login and signup</li>
                                                        <li>Google OAuth Sign in and sign up</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-bold text-foreground mt-0.5">(b)</span>
                                        <span><strong className="text-foreground">Payment Information:</strong> Transaction details processed securely through Creem (Merchant Of Record). After successful payment, we store some required payment info that comes from Creem (Merchant Of Record), our Payment Processor.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-bold text-foreground mt-0.5">(c)</span>
                                        <span><strong className="text-foreground">Usage Data:</strong> Information about how you use our service, including the text provided for speech synthesis.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">3. Credit Card Data</h2>
                                <p className="text-muted-foreground">
                                    We do not store your credit card details. All payment processing is handled securely by our payment processor, <a href="https://creem.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creem</a> (Merchant Of Record).
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">4. Input Text</h2>
                                <p className="text-muted-foreground">
                                    The text you input for speech synthesis is processed to generate the audio. We do not store your input text on our servers or cloud.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">5. Generated Audio Files</h2>
                                <p className="text-muted-foreground">
                                    The audio files generated from your input text are not stored on our cloud servers. They are only available locally on your device during your session and will be cleared once you close your browser tab or window. You retain full ownership of the generated audio files.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">6. How We Use Your Information</h2>
                                <p className="text-muted-foreground">
                                    We use the information we collect (as described in section 2) to:
                                </p>
                                <ul className="space-y-3 text-muted-foreground">
                                    {[
                                        "Provide and maintain our TTS services",
                                        "Process transactions and manage credits",
                                        "Analyze usage to improve performance",
                                        "Communicate updates and security alerts"
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-3">
                                            <span className="text-primary">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">7. Data Storage and Security</h2>
                                <p className="text-muted-foreground">
                                    We use industry-standard security measures to protect your data. Your account information and preferences are stored using Appwrite Cloud's secure infrastructure. While we strive to protect your personal information, no method of transmission over the Internet is 100% secure.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">8. Data Sharing</h2>
                                <p className="text-muted-foreground">
                                    We will not share any data with third parties for any purpose, including training models, except for the specific data required for our core service: the input text you provide is sent to our Text-to-Speech API provider solely for the purpose of audio generation.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">9. Third-Party Services</h2>
                                <p className="text-muted-foreground">
                                    We utilize several third-party services to power VoiceLo. We encourage you to read their terms and privacy policies to understand how they process your information:
                                </p>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>
                                            <strong><a href="https://appwrite.io/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Appwrite Cloud</a>:</strong> Authentication and database management.
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>
                                            <strong><a href="https://www.creem.io/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Creem</a> (Merchant Of Record):</strong> Secure payment processing.
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>
                                            <strong><a href="https://inworld.ai/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Inworld AI</a>:</strong> Text to speech generation via their API.
                                        </span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">10. Your Rights</h2>
                                <p className="text-muted-foreground">
                                    Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete your information. You can manage most of your data directly through your account dashboard.
                                </p>
                            </section>

                            <section className="space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
                                <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                                <p className="text-muted-foreground">
                                    If you have any questions about this Privacy Policy, please contact us at:
                                </p>
                                <p className="text-primary font-semibold text-lg">support@voicelo.app</p>
                            </section>
                        </div>
                    </div>
                </main>

                <Footer />
            </div >
        </div >
    );
}

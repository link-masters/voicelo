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
                                    Welcome to VoiceLo ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our Text-to-Speech platform.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
                                <p className="text-muted-foreground">
                                    We collect information that you provide directly to us when you create an account, make a purchase, or communicate with us. This includes:
                                </p>
                                <ul className="space-y-4 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <span className="text-primary mt-1.5">•</span>
                                        <span><strong className="text-foreground">Account Information:</strong> Name, email address, and authentication credentials through Appwrite.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary mt-1.5">•</span>
                                        <span><strong className="text-foreground">Payment Information:</strong> Transaction details processed securely through {getActiveProviderName()}. We do not store your credit card details.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary mt-1.5">•</span>
                                        <span><strong className="text-foreground">Usage Data:</strong> Information about how you use our service, including the text provided for speech synthesis.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
                                <p className="text-muted-foreground">
                                    We use the information we collect to:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        "Provide and maintain our TTS services",
                                        "Process transactions and manage credits",
                                        "Analyze usage to improve performance",
                                        "Communicate updates and security alerts"
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border flex gap-3 items-center">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-sm font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">4. Data Storage and Security</h2>
                                <p className="text-muted-foreground">
                                    We use industry-standard security measures to protect your data. Your account information and preferences are stored using Appwrite's secure infrastructure. While we strive to protect your personal information, no method of transmission over the Internet is 100% secure.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">5. Third-Party Services</h2>
                                <p className="text-muted-foreground">
                                    We utilize several third-party services to power VoiceLo:
                                </p>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span><strong className="text-foreground">Appwrite:</strong> Authentication and database management.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span><strong className="text-foreground">{getActiveProviderName()}:</strong> Secure payment processing.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span><strong className="text-foreground">Inworld AI:</strong> Advanced neural voice synthesis.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">6. Your Rights</h2>
                                <p className="text-muted-foreground">
                                    Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete your information. You can manage most of your data directly through your account dashboard.
                                </p>
                            </section>

                            <section className="space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10">
                                <h2 className="text-2xl font-bold text-foreground">7. Contact Us</h2>
                                <p className="text-muted-foreground">
                                    If you have any questions about this Privacy Policy, please contact us at:
                                </p>
                                <p className="text-primary font-semibold text-lg">support@voicelo.com</p>
                            </section>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

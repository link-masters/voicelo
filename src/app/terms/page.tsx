import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProviderName } from "@/config/payment";

export default function TermsOfService() {
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
                            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">Terms of Service</h1>
                            <p className="text-muted-foreground text-lg">Last Updated: December 28, 2025</p>
                        </header>

                        <div className="space-y-12">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
                                <p className="text-muted-foreground">
                                    By accessing or using VoiceLo, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">2. Use of Service</h2>
                                <p className="text-muted-foreground">
                                    VoiceLo provides a platform for generating speech from text using artificial intelligence. You are responsible for any content you provide.
                                </p>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {[
                                        "Must be 13+ years old",
                                        "Provide accurate info",
                                        "Maintain account security"
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border text-center text-sm font-medium">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">3. Credits and Payments</h2>
                                <p className="text-muted-foreground">
                                    Our service operates on a credit-based system managed through {getActiveProviderName()}:
                                </p>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>Credits are consumed based on the length of the text processed.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>Credits are non-transferable and have no cash value.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-primary">•</span>
                                        <span>We reserve the right to change our pricing at any time.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">4. Prohibited Conduct</h2>
                                <p className="text-muted-foreground">
                                    You agree NOT to use VoiceLo for:
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <span className="text-red-500">×</span>
                                        <span>Illegal or harmful content</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-500">×</span>
                                        <span>Unauthorized impersonation</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-500">×</span>
                                        <span>Bypassing credit limits</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-500">×</span>
                                        <span>Reverse engineering the platform</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">5. Intellectual Property</h2>
                                <p className="text-muted-foreground">
                                    VoiceLo and its original content, features, and functionality are owned by us. You retain ownership of the original text you provide, but we grant you a license to use the generated audio for your projects according to your plan level.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <div className="p-1 px-4 rounded-full bg-primary/10 border border-primary/20 w-fit text-primary text-xs font-bold uppercase tracking-widest">
                                    Special Addendum
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">6. Voice Cloning Policy</h2>
                                <p className="text-muted-foreground">
                                    Our Voice Cloning feature allows you to create a digital replica of a voice. By using this feature, you agree to the following strict conditions:
                                </p>
                                <ul className="space-y-4 text-muted-foreground">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span><strong className="text-foreground">Right to Clone:</strong> You must own the rights to the voice you are cloning or have explicit, written consent from the individual whose voice is being cloned.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span><strong className="text-foreground">Ethical Use:</strong> You agree not to use cloned voices to deceive, defraud, or harass individuals. This includes but is not limited to creating "Deepfakes" for misinformation.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span><strong className="text-foreground">Biometric Data:</strong> You acknowledge that voice cloning involves the processing of biometric indicators. We handle this data with extreme care as outlined in our Privacy Policy.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span><strong className="text-foreground">Indemnification:</strong> You agree to indemnify and hold VoiceLo harmless from any legal claims arising from your use of a cloned voice without proper authorization.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">7. Limitation of Liability</h2>
                                <p className="text-muted-foreground">
                                    In no event shall VoiceLo be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the service.
                                </p>
                            </section>

                            <section className="space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10">
                                <h2 className="text-2xl font-bold text-foreground">8. Contact Us</h2>
                                <p className="text-muted-foreground">
                                    For legal inquiries or questions regarding these terms:
                                </p>
                                <p className="text-primary font-semibold text-lg">legal@voicelo.com</p>
                            </section>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

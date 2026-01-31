import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProviderName } from "@/config/payment";

export const metadata: Metadata = {
    title: "Terms Of Service | VoiceLo",
    description: "Terms and conditions for using VoiceLo voice synthesis platform.",
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans text-base leading-relaxed">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 w-full">
                    <div className="max-w-4xl mx-auto px-6 py-24 sm:pb-16 sm:pt-32 space-y-16">
                        <header className="space-y-4">
                            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">Terms Of Service</h1>
                            <p className="text-muted-foreground text-lg">Last Updated: January 31, 2026</p>
                        </header>

                        <div className="space-y-12">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
                                <p className="text-muted-foreground">
                                    By accessing or using VoiceLo, you agree to be bound by these Terms Of Service. If you do not agree to all of these terms, do not use our services.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">2. Eligibility and Use Restrictions</h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <h3 className="text-lg font-bold text-foreground">2.1 Age</h3>
                                    <p>If you are under 18 years of age (or the age of legal majority where you live), you may not use our Services.</p>

                                    <h3 className="text-lg font-bold text-foreground mt-4">2.2 Authorization</h3>
                                    <p>If you register, access or use our Services on behalf of another person or entity:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>You represent that you are authorized to enter into these Terms on their behalf.</li>
                                        <li>You agree that they are also responsible to us if these Terms are violated.</li>
                                        <li>If you are an entity, you are responsible for your employees' usage and compliance.</li>
                                    </ul>

                                    <h3 className="text-lg font-bold text-foreground mt-4">2.3 Usage & Commercial Rights</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Free Users:</strong> May only use the Services and Output for <strong>non-commercial</strong> purposes.</li>
                                        <li><strong>Paid Users:</strong> May use the Services and Output for <strong>commercial</strong> purposes.</li>
                                        <li>In all cases, usage must comply with our Prohibited Use Policy.</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">3. Credits and Payments</h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Our service operates primarily on a credit-based system handled by our Merchant of Record, {getActiveProviderName()}.</p>

                                    <h3 className="text-lg font-bold text-foreground mt-4">3.1. Payment Terms</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>One-Time Payments:</strong> Our "Starter" and "Plus" packs are one-time purchases and do not automatically renew. You are charged only once per transaction.</li>
                                        <li><strong>Currency:</strong> All prices are in the currency displayed at checkout (typically USD) and include applicable taxes unless stated otherwise.</li>
                                    </ul>

                                    <h3 className="text-lg font-bold text-foreground mt-4">3.2. Refund Policy</h3>
                                    <p>
                                        Refunds are governed by our specific <Link href="/refund" className="text-primary font-medium hover:underline">Refund Policy</Link>. Generally, refunds are only available within 7 days of purchase if less than 10% of credits have been used. Please review the full Refund Policy page for details.
                                    </p>
                                </div>
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
                                <h2 className="text-2xl font-bold text-foreground">5. Intellectual Property & Licensing</h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        VoiceLo and its original content are owned by us. However, your rights to the generated content depend on your subscription plan:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Free Plan:</strong> You are granted a non-exclusive, non-commercial license to use the generated audio and AI-written text. Attribution to VoiceLo is required for public usage.</li>
                                        <li><strong>Paid Plans (Starter / Plus):</strong> You are granted a non-exclusive, perpetual, commercial license to use the generated audio and AI-written text for any legal purpose, including monetization (e.g., YouTube, Podcasts, Audiobooks).</li>
                                    </ul>
                                    <p>
                                        You retain full ownership of the text scripts you upload or generate using our AI tools. By using the service, you grant VoiceLo a limited license to store and process these scripts solely for the purpose of providing the service (including history features) and generating audio.
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-6">

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
                                        <span><strong className="text-foreground">Indemnification:</strong> You agree to indemnify and hold VoiceLo harmless from any legal claims arising from your use of a cloned voice without proper authorization.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">7. AI Writing Services</h2>
                                <p className="text-muted-foreground">
                                    Our AI Writing feature allows you to generate text content. By using this feature, you acknowledge that:
                                </p>
                                <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                                    <li>The content is generated by artificial intelligence and may not always be accurate or error-free.</li>
                                    <li>You are responsible for reviewing and verifying any AI-generated content before using it.</li>
                                    <li>You may not use the AI Writing feature to generate illegal, harmful, or abusive content.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">8. User Generated Content</h2>
                                <p className="text-muted-foreground">
                                    You are solely responsible for the content (text and voice samples) you upload. VoiceLo does not endorse any user-generated content. We reserve the right to remove any content that violates these Terms or is deemed inappropriate, without prior notice.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">9. Termination</h2>
                                <p className="text-muted-foreground">
                                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">10. Disclaimer and Limitation of Liability</h2>
                                <p className="text-muted-foreground">
                                    The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. VoiceLo makes no warranties, whether express or implied, regarding the uptime or availability of the service. In no event shall VoiceLo be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the service.
                                </p>
                            </section>

                            <section className="space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
                                <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                                <p className="text-muted-foreground">
                                    If you have any questions about this Terms of Service, please contact us at:
                                </p>
                                <p className="text-primary font-semibold text-lg">support@voicelo.app</p>
                            </section>



                        </div>
                    </div>


                </main>

                <Footer />
            </div>
        </div>
    );
}

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProviderName } from "@/config/payment";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
                    <div className="space-y-12">
                        <header className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Refund Policy</h1>
                            <p className="text-muted-foreground">Last Updated: December 28, 2025</p>
                        </header>

                        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">1. Digital Products Policy</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    VoiceLo provides digital goods (credits) that are consumed upon use. As such, refunds are provided solely at our discretion and must meet specific eligibility criteria regarding timeframe and usage. Please refer to section 2 for eligibility details and section 3 for non-refundable conditions.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">2. Eligibility for Refunds</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    You are eligible for a refund only if <strong>both</strong> of the following conditions are met:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li><strong>Timeframe:</strong> The refund request is made within 7 days of the payment date.</li>
                                    <li><strong>Usage:</strong> Less than 10% of the purchased credits have been used.</li>
                                </ul>
                                <p className="text-muted-foreground leading-relaxed mt-4">
                                    Technical failures that prevent service usage are exempt from these limits and handled on a case-by-case basis.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">3. Non-Refundable Items</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Refunds will <strong>not</strong> be processed under the following conditions:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li><strong>Usage Limit Exceeded:</strong> If more than 10% of the credits from the purchase have been used.</li>
                                    <li><strong>Time Limit Exceeded:</strong> If more than 7 days have passed since the payment, even if zero credits were used.</li>
                                    <li>Charges resulting from unauthorized access to your account (it is your responsibility to secure your account).</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">4. How to Request a Refund</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    To request a refund, please contact us via <Link href="/contact" className="text-primary hover:underline">Contact Form</Link> or via mail at <span className="text-primary font-medium">support@voicelo.app</span> with your order number (from {getActiveProviderName()}) and the reason for your request. We aim to process all requests within 5-10 business days.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">5. Chargebacks</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We encourage you to contact us before initiating a chargeback with your bank. We are committed to resolving issues fairly. Unauthorized chargebacks may result in the permanent suspension of your VoiceLo account.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">6. {getActiveProviderName()}</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    All transactions are handled by <Link href="https://creem.io" target="_blank" className="text-primary hover:underline">{getActiveProviderName()}</Link>, our Merchant of Record. Some refund rules may be governed by their own terms and conditions in addition to ours.
                                </p>
                            </section>

                            <section className="space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
                                <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                                <p className="text-muted-foreground">
                                    If you have any questions about this Refund Policy, please contact us at:
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

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen text-foreground selection:bg-indigo-500/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-indigo-500/20 rounded-full blur-[120px]" />
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
                                    VoiceLo provides digital goods (credits) that are consumed upon use. As such, <strong className="text-foreground">all orders that are completed successfully without error are non-refundable</strong>. Please refer to section 3 for a full list of non-refundable conditions.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">2. Eligibility for Refunds</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    You may be eligible for a refund under the following circumstances:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li><strong>Technical Issues:</strong> If a technical failure on our end prevents you from using your purchased credits.</li>
                                    <li><strong>Duplicate Purchase:</strong> If you accidentally purchased the same credit pack twice due to a system error.</li>
                                    <li><strong>Unused Credits:</strong> If you requested a refund within 14 days of purchase and have not used any of the credits from that specific transaction.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">3. Non-Refundable Items</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    The following are non-refundable:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Successfully completed orders where no technical error occurred during the transaction.</li>
                                    <li>Credits that have already been partially or fully used for speech generation.</li>
                                    <li>Payments made more than 14 days prior to the refund request.</li>
                                    <li>Charges resulting from unauthorized access to your account (it is your responsibility to secure your account).</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">4. How to Request a Refund</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    To request a refund, please contact us at support@voicelo.com with your order number (from Lemon Squeezy) and the reason for your request. We aim to process all requests within 5-10 business days.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">5. Chargebacks</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We encourage you to contact us before initiating a chargeback with your bank. We are committed to resolving issues fairly. Unauthorized chargebacks may result in the permanent suspension of your VoiceLo account.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">6. Lemon Squeezy</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    All transactions are handled by Lemon Squeezy, our Merchant of Record. Some refund rules may be governed by their own terms and conditions in addition to ours.
                                </p>
                            </section>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

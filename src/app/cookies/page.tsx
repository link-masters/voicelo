import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProviderName } from "@/config/payment";

export default function CookiePolicy() {
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
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Cookie Policy</h1>
                            <p className="text-muted-foreground">Last Updated: December 28, 2025</p>
                        </header>

                        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">1. What are cookies?</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">2. How we use cookies</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    VoiceLo uses cookies to enhance your experience, remember your preferences, and ensure the security of your account.
                                </p>
                                <div className="grid gap-6 mt-6">
                                    <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                                        <h3 className="font-bold mb-2">Essential Cookies</h3>
                                        <p className="text-sm text-muted-foreground">These are necessary for the website to function. They include cookies for authentication (Appwrite Cloud) and secure payments ({getActiveProviderName()}).</p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                                        <h3 className="font-bold mb-2">Performance & Analytics</h3>
                                        <p className="text-sm text-muted-foreground">We may use cookies to understand how visitors interact with our website, helping us identify errors and improve performance.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                                        <h3 className="font-bold mb-2">Preference Cookies</h3>
                                        <p className="text-sm text-muted-foreground">These allow our website to remember choices you make (such as your theme preference or language) to providing a more personalized experience.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">4. Third-Party Cookies</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    In addition to our own cookies, we may also use various third-party cookies for backend-as-a-service (BaaS) and Merchant of record, and so on.
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
                                    <li><strong>Appwrite Cloud:</strong> Used for managing your session and security.</li>
                                    <li><strong>{getActiveProviderName()} (Merchant of record):</strong> Used for processing payments and preventing fraud.</li>
                                    <li><strong>Vercel:</strong> Used for performance analytics and speed insights.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold">5. Updates to this policy</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We may update our Cookie Policy from time to time to reflect changes in the cookies we use or for other operational, legal, or regulatory reasons.
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

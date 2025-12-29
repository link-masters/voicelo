"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie-consent", "declined");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-[calc(100%-3rem)] sm:w-[400px] pointer-events-none">
            <div className="bg-background/95 backdrop-blur-xl border border-border/50 shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.3)] rounded-2xl p-5 pointer-events-auto animate-in fade-in slide-in-from-right-10 duration-500 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                <Cookie className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">Cookie Policy</h3>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        We use cookies to enhance your experience and secure your account. By continuing, you agree to our{" "}
                        <Link href="/cookies" className="text-indigo-500 hover:underline font-medium decoration-2 underline-offset-4">
                            Cookie Policy
                        </Link>.
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDecline}
                            className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-transparent"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all outline-none"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

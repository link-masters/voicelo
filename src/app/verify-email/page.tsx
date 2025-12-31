"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyUserToken } from "@/app/actions/emailActions";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        const userId = searchParams.get("userId");
        const token = searchParams.get("token");

        if (!userId || !token) {
            setStatus("error");
            setMessage("Invalid verification link. Please check your email.");
            return;
        }

        verifyUserToken(userId, token)
            .then((result: any) => {
                if (result.success) {
                    setStatus("success");
                    setMessage("Your email has been successfully verified! You can now access all features.");
                    // Redirect after 3 seconds
                    setTimeout(() => router.push("/dashboard"), 3000);
                } else {
                    setStatus("error");
                    setMessage(result.error || "Verification failed. The link may be expired.");
                }
            })
            .catch((err: any) => {
                setStatus("error");
                setMessage("An unexpected error occurred. Please try again later.");
            });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card rounded-3xl shadow-xl shadow-primary/10 p-8 text-center border border-primary/10">
                {status === "loading" && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Checking verification</h1>
                        <p className="text-gray-500 leading-relaxed">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
                        <p className="text-gray-500 leading-relaxed">{message}</p>
                        <div className="pt-4">
                            <Link
                                href="/dashboard"
                                className="inline-block bg-primary text-primary-foreground hover:opacity-90 px-8 py-3 rounded-2xl font-medium transition-all shadow-lg shadow-primary/20"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                                <XCircle className="h-10 w-10 text-rose-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
                        <p className="text-gray-500 leading-relaxed">{message}</p>
                        <div className="pt-4">
                            <Link
                                href="/"
                                className="inline-block bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-3 rounded-2xl font-medium transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        }>
            <VerifyEmailInner />
        </Suspense>
    );
}

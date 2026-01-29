"use client";

import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToSignUp: () => void;
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [unverifiedUser, setUnverifiedUser] = useState<{ userId: string, userName: string, email: string } | null>(null);
    const [isResending, setIsResending] = useState(false);
    const { login, loginWithGoogle, resendVerification } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
            onClose();
            // Reset form
            setEmail("");
            setPassword("");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
            if (err.type === "email_not_verified") {
                setUnverifiedUser({
                    userId: err.userId,
                    userName: err.userName,
                    email: err.email
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedUser) return;
        setIsResending(true);
        try {
            await resendVerification(unverifiedUser.userId, unverifiedUser.email, unverifiedUser.userName);
            setError("A new verification link has been sent to your email.");
            setUnverifiedUser(null);
        } catch (err: any) {
            setError(err.message || "Failed to resend verification link.");
        } finally {
            setIsResending(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error: any) {
            setError(error.message || "Failed to sign in with Google");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-20 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border border-border dark:border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
                    <p className="text-muted-foreground text-sm">Sign in to access your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-secondary/50 border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-muted-foreground"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-secondary/50 border border-border text-foreground rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-muted-foreground"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-primary hover:opacity-80 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm space-y-3">
                            <p>{error}</p>
                            {unverifiedUser && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-primary/30"
                                >
                                    {isResending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            Resending...
                                        </>
                                    ) : (
                                        "Resend Verification Email"
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn bg-primary hover:opacity-90 text-primary-foreground py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="flex items-center my-6 gap-4">
                    <div className="flex-1 border-t border-border"></div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Or continue with</span>
                    <div className="flex-1 border-t border-border"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full bg-foreground text-background hover:opacity-90 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-md"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign in with Google
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToSignUp}
                        className="text-primary font-medium hover:opacity-80 transition-colors"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
}

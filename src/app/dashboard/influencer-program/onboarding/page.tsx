"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Zap,
    DollarSign,
    CheckCircle2,
    ArrowRight,
    Youtube,
    TrendingUp,
    ShieldCheck,
    Star,
    Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InfluencerOnboarding() {
    const { user, refreshUser } = useAuth();
    const [selectedType, setSelectedType] = useState<'credits' | 'commission' | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [showVerifyPopup, setShowVerifyPopup] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const prefs = user?.prefs as any;

    useEffect(() => {
        if (prefs?.influencerCode) {
            router.replace('/dashboard/influencer-program');
        } else if (prefs?.awaitingCommissionVerification) {
            setSelectedType('commission');
            setShowVerifyPopup(true);
        }
    }, [prefs, router]);

    const starterReward = Number(process.env.NEXT_PUBLIC_INFLUENCER_REWARD_CREDITS_STARTER) || 5000;
    const plusReward = Number(process.env.NEXT_PUBLIC_INFLUENCER_REWARD_CREDITS_PLUS) || 10000;

    const handleJoin = async () => {
        if (!user?.$id || !selectedType) return;
        setIsJoining(true);
        setError(null);
        try {
            const response = await fetch('/api/influencer/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.$id,
                    type: selectedType
                })
            });
            const data = await response.json();
            if (data.success) {
                if (data.awaitingCommissionVerification) {
                    setShowVerifyPopup(true);
                } else {
                    window.location.href = '/dashboard/influencer-program';
                }
            } else {
                setError(data.error || "An error occurred while joining the program.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 md:py-20 px-6">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    Influencer Onboarding
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Choose Your Path
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    Select how you want to be rewarded for your impact. This selection is permanent and custom-tailored to your reach.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Standard Influencer (Credits) */}
                <div
                    onClick={() => setSelectedType('credits')}
                    className={`relative p-10 rounded-[3rem] border-2 transition-all cursor-pointer group ${selectedType === 'credits'
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10'
                        : 'border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/10'
                        }`}
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${selectedType === 'credits' ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400'
                        }`}>
                        <Star className="w-7 h-7" />
                    </div>

                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Community Influencer</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                        Perfect for regular users who want to earn extra credits for free voice generations and clones.
                    </p>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            Up to {plusReward.toLocaleString()} credits per sale
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            Instant 10% discount for your friends
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            No social verification required
                        </li>
                    </ul>

                    {selectedType === 'credits' && (
                        <div className="absolute top-6 right-6">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Elite Creator (Commission) */}
                <div
                    onClick={() => setSelectedType('commission')}
                    className={`relative p-10 rounded-[3rem] border-2 transition-all cursor-pointer group ${selectedType === 'commission'
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10'
                        : 'border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/10'
                        }`}
                >
                    <div className="absolute top-8 right-8">
                        {selectedType === 'commission' && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${selectedType === 'commission' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400'
                        }`}>
                        <Crown className="w-7 h-7" />
                    </div>

                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Elite Creator</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                        For professional content creators, YouTubers, and TikTokers who want to build a revenue stream.
                    </p>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            30% High-margin cash commission
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            Access to Creator Partner Portal
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            Social Verification required (500+ subs)
                        </li>
                    </ul>

                    {selectedType === 'commission' && (
                        <div className="absolute top-6 right-6">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center">
                    {error}
                </div>
            )}

            <div className="flex flex-col items-center">
                <button
                    disabled={!selectedType || isJoining}
                    onClick={handleJoin}
                    className="w-full md:w-auto px-12 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-3xl transition-all shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                >
                    {isJoining ? "Finalizing..." : "Complete Setup & Join"}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="mt-6 text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest">
                    Permanent Selection • Cannot be changed later
                </p>
            </div>

            {/* Verification Required Popup */}
            {showVerifyPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-500" />
                    <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-primary" />

                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
                                <ShieldCheck className="w-10 h-10 text-emerald-500 z-10" />
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl animate-ping opacity-20" />
                            </div>

                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight uppercase">Program Setup Started!</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
                                To activate your **Elite Creator** status and start earning 30% cash commission, you must now connect your YouTube channel for audience verification.
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => window.location.href = '/dashboard/influencer-program/verify'}
                                    className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
                                >
                                    Go to Verification Center
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                    Required for Cash Commission Access
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

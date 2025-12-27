"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Youtube,
    CheckCircle2,
    Lock,
    ArrowRight,
    Search,
    ShieldCheck,
    X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function VerifyPage() {
    const { user, refreshUser } = useAuth();
    const [showVerifySuccess, setShowVerifySuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const prefs = user?.prefs as any;
    const isAllowed = prefs?.is_influencer_allowed === true || prefs?.is_influencer_allowed === "true";
    const isRequestPending = prefs?.influencer_request_pending === true || prefs?.influencer_request_pending === "true";
    const youtubeStats = prefs?.youtube_verification;

    // Handle verification success cleanup
    useEffect(() => {
        const verified = searchParams.get('verified');
        if (verified === 'youtube') {
            setShowVerifySuccess(true);
            refreshUser();

            // Remove the param from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('verified');
            router.replace(url.pathname + url.search);

            // Auto hide success message
            setTimeout(() => {
                setShowVerifySuccess(false);
            }, 5000);
        }
    }, [searchParams, router, refreshUser]);

    const handleSocialVerify = (platform: 'youtube' | 'facebook') => {
        if (!user?.$id) return;
        const loginUrl = platform === 'youtube'
            ? `/api/auth/youtube/login?userId=${user.$id}`
            : `/api/auth/facebook/login?userId=${user.$id}`;
        window.location.href = loginUrl;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Verification Success Notification */}
            {showVerifySuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-full duration-500">
                    <div className="bg-emerald-500 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/30 flex items-center gap-4 border border-emerald-400/50 backdrop-blur-xl">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm">YouTube Verified!</p>
                            <p className="text-xs text-emerald-50 opacity-90">Your account is now connected and synced.</p>
                        </div>
                        <button
                            onClick={() => setShowVerifySuccess(false)}
                            className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Social Verification</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Connect and verify your social media presence to unlock influencer benefits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* YouTube Card */}
                <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] flex flex-col justify-between shadow-sm group hover:border-red-500/20 transition-all">
                    <div>
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Youtube className="w-7 h-7 text-red-500" />
                            </div>
                            {youtubeStats && (
                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">YouTube Channel</h3>
                        {youtubeStats ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{youtubeStats.title}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{youtubeStats.customUrl || 'Official Channel'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Subscribers</p>
                                        <p className="text-lg font-black text-zinc-900 dark:text-white">{youtubeStats.subscriberCount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Videos</p>
                                        <p className="text-lg font-black text-zinc-900 dark:text-white">{youtubeStats.videoCount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                                Connect your YouTube channel to automatically verify your audience reach and speed up your approval.
                            </p>
                        )}
                    </div>

                    {!youtubeStats && (
                        <button
                            onClick={() => handleSocialVerify('youtube')}
                            className="mt-6 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <Youtube className="w-5 h-5" />
                            Connect YouTube
                        </button>
                    )}
                </div>

                {/* Info Card */}
                <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Why Verify?</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <p className="text-sm text-indigo-100 leading-relaxed">Faster application review and whitelisting.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <p className="text-sm text-indigo-100 leading-relaxed">Access to higher commission rates based on reach.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Search className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Verification Status</p>
                                <p className="text-sm font-bold text-white">{isAllowed ? 'Whitelisted' : isRequestPending ? 'Under Review' : 'Incomplete'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Section if not allowed */}
            {!isAllowed && (
                <div className="p-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[3rem] text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Request Whitelist Access</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        Once you've connected at least one social account, you can request to be whitelisted for the Influencer Program.
                    </p>
                    <button
                        disabled={!youtubeStats || isRequestPending}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {isRequestPending ? 'Request Pending' : 'Submit Application'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    {!youtubeStats && (
                        <p className="mt-4 text-xs text-red-500 font-bold uppercase tracking-widest opacity-80">
                            Connect a social account first
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

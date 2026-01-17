"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Youtube,
    CheckCircle2,
    Lock,
    ArrowRight,
    Search,
    ShieldCheck,
    DollarSign,
    AlertTriangle,
    Eye,
    Info,
    RefreshCw,
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
    const influencerType = prefs?.influencerType || "credits";

    // Re-check criteria locally based on current ENV values
    const minSubs = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500;
    const minViews = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_VIEWS) || 2000;
    const currentlyMeetsCriteria = youtubeStats &&
        youtubeStats.subscriberCount >= minSubs &&
        (youtubeStats.viewCount || 0) >= minViews;

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

            {/* Criteria Warning Banner - Only if they DON'T meet current criteria and chose commission path */}
            {youtubeStats && (prefs?.awaitingCommissionVerification || influencerType === 'commission') && !currentlyMeetsCriteria && (
                <div className="p-4 md:p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Commission Criteria Not Met</h4>
                        <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed">
                            Your channel "{youtubeStats.title}" is connected, but hasn't reached the minimum requirements ({(Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500).toLocaleString()}+ subscribers & {(Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_VIEWS) || 2000).toLocaleString()}+ views) for the Cash Commission program.
                            <strong> Commission earning is locked until these requirements are met.</strong> Reach the target and sync your channel stats!
                        </p>
                    </div>
                </div>
            )}

            {/* Banner for Credit Influencers */}
            {influencerType === 'credits' && !!prefs?.influencerCode && (
                <div className="p-4 md:p-6 bg-primary/10 border border-primary/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Verification Not Required</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            As a <strong>Community Influencer</strong>, you are already earning credits for your referrals. Social verification is completely optional and only needed if you wish to upgrade to the cash commission program later.
                        </p>
                    </div>
                </div>
            )}

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
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Subscribers</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-none mt-1">{youtubeStats.subscriberCount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Videos</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-none mt-1">{youtubeStats.videoCount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Views</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-none mt-1">{(youtubeStats.viewCount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                                Connect your YouTube channel to automatically verify your audience reach and speed up your approval.
                            </p>
                        )}
                    </div>

                    {!youtubeStats ? (
                        <button
                            disabled={influencerType === 'credits' && !!prefs?.influencerCode}
                            onClick={() => handleSocialVerify('youtube')}
                            className="mt-6 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <Youtube className="w-5 h-5" />
                            {influencerType === 'credits' && !!prefs?.influencerCode ? "Verification Not Needed" : "Connect YouTube"}
                        </button>
                    ) : (currentlyMeetsCriteria && (influencerType === 'credits' || !prefs?.influencerCode)) ? (
                        <button
                            onClick={() => handleSocialVerify('youtube')}
                            className="mt-6 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                        >
                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {prefs?.influencerCode ? "Upgrade to Commission Now" : "Sync & Activate Elite Status"}
                        </button>
                    ) : influencerType === 'commission' && !prefs?.influencerCode && !currentlyMeetsCriteria ? (
                        <button
                            onClick={() => handleSocialVerify('youtube')}
                            className="mt-6 w-full py-3.5 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-white/10"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Re-sync Channel Stats
                        </button>
                    ) : null}
                </div>

                {/* Info Card */}
                <div className="p-8 bg-primary rounded-[2.5rem] text-primary-foreground flex flex-col justify-between shadow-xl relative overflow-hidden group">
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
                                <p className="text-sm text-primary-foreground/90 leading-relaxed">Faster application review and whitelisting.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <p className="text-sm text-primary-foreground/90 leading-relaxed">Access to higher commission rates based on reach.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Search className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">Verification Status</p>
                                <p className="text-sm font-bold text-white uppercase tracking-widest">{isAllowed ? 'Whitelisted' : isRequestPending ? 'Under Review' : 'Incomplete'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Section only if no YouTube is connected and they aren't already joined */}
            {influencerType !== 'commission' && !youtubeStats && !prefs?.influencerCode && (
                <div className="p-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[3rem] text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <DollarSign className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Upgrade to Commission</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        You are currently earning credits for your referrals. Connect a verified YouTube channel (min. {(Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500).toLocaleString()} subs) to switch to 30% cash commission.
                    </p>
                    <button
                        onClick={() => handleSocialVerify('youtube')}
                        className="px-8 py-3.5 bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 mx-auto hover:bg-red-700 hover:scale-[1.02]"
                    >
                        <Youtube className="w-5 h-5" />
                        Verify YouTube for Cash
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    {!youtubeStats && (
                        <p className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                            Automated approval for channels with {(Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500).toLocaleString()}+ subscribers
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

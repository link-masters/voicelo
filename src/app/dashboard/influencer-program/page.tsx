"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Users,
    DollarSign,
    TrendingUp,
    Calendar,
    Info,
    ArrowRight,
    Zap,
    Copy,
    CheckCircle2,
    RefreshCw,
    Lock,
    Youtube,
    ShieldAlert,
    X
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function InfluencerHubPage() {
    const { user, refreshUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isRequestingAccess, setIsRequestingAccess] = useState(false);
    const [lsData, setLsData] = useState<any>(null);
    const [lockError, setLockError] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showVerifySuccess, setShowVerifySuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const prefs = user?.prefs as any;
    const influencerCode = prefs?.influencerCode;
    const isAllowed = prefs?.is_influencer_allowed === true || prefs?.is_influencer_allowed === "true";
    const isRequestPending = prefs?.influencer_request_pending === true || prefs?.influencer_request_pending === "true";
    const discountRate = Number(prefs?.influencer_discount_rate) || 10;
    const commissionRate = Number(prefs?.influencer_commission_rate) || 30;

    const youtubeStats = prefs?.youtube_verification;

    const handleJoin = async () => {
        if (!user?.$id) return;
        setIsJoining(true);
        setLockError(null);
        try {
            const currentAccount = await account.get();
            const prefs = currentAccount.prefs as any;
            const isAllowed = prefs?.is_influencer_allowed;

            if (isAllowed !== true && isAllowed !== "true") {
                setLockError("Your account has not been whitelisted for our Influencer Program yet. We are currently accepting new influencers on a case-by-case basis.");
                setIsJoining(false);
                return;
            }

            const response = await fetch('/api/influencer/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.$id })
            });
            const data = await response.json();
            if (data.success) {
                await handleRefresh(true);
            } else {
                setLockError(data.error || "An error occurred while joining the program.");
            }
        } catch (err) {
            setLockError("Something went wrong while verifying your account. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!user?.$id) return;

        if (!youtubeStats) {
            setShowVerifyModal(true);
            return;
        }

        setIsRequestingAccess(true);
        try {
            await account.updatePrefs({
                ...user.prefs,
                is_influencer_allowed: false,
                influencer_request_pending: true,
                influencer_requested_at: new Date().toISOString()
            });
            await refreshUser();
        } catch (err) {
            console.error("Failed to request influencer access:", err);
        } finally {
            setIsRequestingAccess(false);
        }
    };

    const handleSocialVerify = (platform: 'youtube' | 'facebook') => {
        if (!user?.$id) return;
        const loginUrl = platform === 'youtube'
            ? `/api/auth/youtube/login?userId=${user.$id}`
            : `/api/auth/facebook/login?userId=${user.$id}`;
        window.location.href = loginUrl;
    };

    const handleRefresh = async (force = false) => {
        if (!user?.$id) return;
        setIsRefreshing(true);
        try {
            await refreshUser();
            const response = await fetch(`/api/influencer/stats?userId=${user.$id}${force ? '&refresh=true' : ''}`);
            const data = await response.json();
            if (!data.error) {
                setLsData(data);
            }
        } catch (err) {
            console.error("Failed to sync LS data:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle verification success cleanup
    useEffect(() => {
        const verified = searchParams.get('verified');
        if (verified === 'youtube') {
            setShowVerifySuccess(true);
            handleRefresh(true);

            // Remove the param from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('verified');
            router.replace(url.pathname + url.search);

            // Auto hide success message
            setTimeout(() => {
                setShowVerifySuccess(false);
            }, 5000);
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (user?.$id && !lsData) {
            handleRefresh();
        }
    }, [user?.$id]);

    const totalRedemptions = lsData?.totalRedemptions || (user?.prefs as any)?.totalRedemptions || 0;
    const approvedCommission = lsData?.approvedCommission || 0;
    const redemptionsList = lsData?.redemptions || (user?.prefs as any)?.redemptions || [];
    const usageLimit = lsData?.usageLimit ? Number(lsData.usageLimit) : null;
    const usageCount = Math.max(lsData?.usageCount ? Number(lsData.usageCount) : 0, totalRedemptions);

    const formatValue = (val: number) => {
        return `$${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const referralLink = `${window.location.origin}/pricing?discount=${influencerCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderContent = () => {
        if (!influencerCode) {
            if (!isAllowed && isRequestPending) {
                return (
                    <div className="max-w-4xl mx-auto py-12 md:py-20 px-6 text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-500/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8">
                            <Lock className="w-10 h-10 md:w-12 md:h-12 text-amber-600" />
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 md:mb-6">Influencer Program Restricted</h1>
                        <p className="text-sm md:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-8 md:mb-10 leading-relaxed">
                            Your account has not been whitelisted for our Influencer Program yet. We are currently accepting new influencers on a case-by-case basis.
                        </p>
                        <div className="p-5 md:p-6 bg-zinc-50 dark:bg-white/5 rounded-[1.5rem] md:rounded-3xl inline-flex items-center gap-3 border border-zinc-200 dark:border-white/10">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs md:text-sm font-bold text-zinc-600 dark:text-zinc-400">Status: Account Under Review</span>
                        </div>
                    </div>
                );
            }

            return (
                <div className="max-w-4xl mx-auto py-12 md:py-20 px-4 md:px-6 text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-500/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 animate-pulse">
                        <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-indigo-500" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4 md:mb-6">Join our Influencer Program</h1>
                    <p className="text-sm md:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-8 md:mb-10 leading-relaxed">
                        Earn a <span className="text-indigo-600 dark:text-indigo-400 font-bold">{commissionRate}% commission</span> on every sale you refer.
                        Track your impact in real-time.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                        {!isAllowed ? (
                            <button
                                onClick={handleRequestAccess}
                                disabled={isRequestingAccess}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm md:text-base group"
                            >
                                {isRequestingAccess ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                {isRequestingAccess ? "Requesting..." : "Request Access"}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm md:text-base group"
                            >
                                {isJoining ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                {isJoining ? "Generating..." : "Join Program Now"}
                            </button>
                        )}
                        <button className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all text-sm md:text-base">
                            View Terms
                        </button>
                    </div>

                    {lockError && (
                        <div className="mt-10 md:mt-12 p-6 md:p-8 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[2rem] md:rounded-[2.5rem] max-w-xl mx-auto flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-amber-600 dark:text-amber-400">
                                <Lock className="w-7 h-7 md:w-8 md:h-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mb-2 md:mb-3">Participation Restricted</h3>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{lockError}</p>
                            <div className="mt-6 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs md:text-sm font-bold">
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                Status: Pending Review
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Influencer Dashboard</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Track your promotional impact and earned commissions ({commissionRate}% rate).</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm">
                        <div className="px-4 py-2 border-r border-zinc-100 dark:border-white/5 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Your Code ({discountRate}%)</p>
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{influencerCode}</p>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border border-zinc-200 dark:border-white/5"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                            onClick={() => handleRefresh(true)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? "Syncing..." : "Sync Now"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-8 shadow-sm group hover:border-indigo-500/20 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Total Redemptions</p>
                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{totalRedemptions}</h3>
                    </div>
                    <div className="bg-indigo-600 rounded-[2rem] border border-indigo-500/20 p-8 shadow-xl group hover:scale-[1.02] transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-indigo-100">Approved Commission</p>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">{commissionRate}% Rate</span>
                        </div>
                        <h3 className="text-3xl font-black text-white">{formatValue(approvedCommission)}</h3>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-8 shadow-sm group hover:border-amber-500/20 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Code Usage</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{usageCount || 0}</h3>
                            <span className="text-lg font-bold text-zinc-400">/ {usageLimit || '∞'}</span>
                        </div>
                        {usageLimit && (
                            <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (usageCount / usageLimit) * 100)}%` }}></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                        </div>
                        Recent Redemptions
                    </h2>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center leading-none">Plan</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Commission</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {redemptionsList.length > 0 ? (
                                        redemptionsList.map((red: any, idx: number) => (
                                            <tr key={red.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">{idx + 1}</div>
                                                        <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{red.userEmail}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-[10px] font-black text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 uppercase tracking-widest">{red.planName}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{new Date(red.timestamp).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="font-black text-zinc-900 dark:text-white">{formatValue(red.amount)}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`font-black ${red.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>{red.status === 'Approved' ? `+${formatValue(red.commission)}` : '$0.00'}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${red.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>{red.status || 'Pending'}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                        <Info className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-bold text-zinc-900 dark:text-white">No redemptions yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                        {redemptionsList.length > 0 ? (
                            redemptionsList.map((red: any, idx: number) => (
                                <div key={red.id || idx} className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-5 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">{idx + 1}</div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-zinc-900 dark:text-white truncate">{red.userEmail}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(red.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700">•</span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{red.planName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest shrink-0 ${red.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>{red.status || 'Pending'}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Amount</p>
                                            <p className="text-sm font-black text-zinc-900 dark:text-white">{formatValue(red.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Commission</p>
                                            <p className={`text-sm font-black ${red.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>{red.status === 'Approved' ? `+${formatValue(red.commission)}` : '$0.00'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 p-12 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mx-auto mb-4">
                                    <Info className="w-8 h-8" />
                                </div>
                                <p className="font-bold text-zinc-900 dark:text-white">No redemptions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 md:p-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 md:-mr-20 md:-mt-20"></div>
                    <div className="relative z-10 space-y-5 md:space-y-6">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] md:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Zap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        <div className="max-w-xl">
                            <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 tracking-tight">Professional Payouts</h3>
                            <p className="text-sm md:text-base text-indigo-100 leading-relaxed mb-6">Commissions are paid out on the 1st of every month once you exceed {formatValue(50)}.</p>
                            <button className="w-full sm:w-auto px-6 py-3.5 bg-white text-indigo-600 font-black rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                View Policy <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderContent()}

            {/* Verification Success Notification */}
            {showVerifySuccess && (
                <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-full duration-500 w-[calc(100%-2rem)] max-w-sm">
                    <div className="bg-emerald-500 text-white px-5 py-4 rounded-[2rem] shadow-2xl shadow-emerald-500/30 flex items-center gap-4 border border-emerald-400/50 backdrop-blur-xl">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <p className="font-black text-sm uppercase tracking-tight">Verified!</p>
                            <p className="text-[10px] text-emerald-50 opacity-90 truncate font-medium tracking-tight">Your account is connected and synced.</p>
                        </div>
                        <button
                            onClick={() => setShowVerifySuccess(false)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {showVerifyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowVerifyModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-indigo-600 to-red-500" />
                        <button onClick={() => setShowVerifyModal(false)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 transition-colors"><X className="w-5 h-5" /></button>
                        <div className="p-8 md:p-10 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 relative shrink-0">
                                <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-red-500 z-10" />
                                <div className="absolute inset-0 bg-red-500/20 rounded-[1.5rem] md:rounded-[2rem] animate-ping opacity-20" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3 md:mb-4 tracking-tight">Verification Required</h3>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">To protect program integrity, connecting a YouTube channel is required before requesting access.</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { setShowVerifyModal(false); router.push('/dashboard/influencer-program/verify'); }}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group text-xs uppercase tracking-widest"
                                >
                                    Verify Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button onClick={() => setShowVerifyModal(false)} className="w-full py-4 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-black rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-all text-xs uppercase tracking-widest">Maybe Later</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

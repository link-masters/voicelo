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
    RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";

export default function InfluencerHubPage() {
    const { user, refreshUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [lsData, setLsData] = useState<any>(null);

    const influencerCode = (user?.prefs as any)?.influencerCode;

    const handleJoin = async () => {
        if (!user?.$id) return;
        setIsJoining(true);
        try {
            const response = await fetch('/api/influencer/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.$id })
            });
            const data = await response.json();
            if (data.success) {
                await handleRefresh(true);
            } else {
                console.error("Join error:", data.error);
            }
        } catch (err) {
            console.error("Failed to join influencer program:", err);
        } finally {
            setIsJoining(false);
        }
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

    // Initial load
    useEffect(() => {
        if (user?.$id && !lsData) {
            handleRefresh();
        }
    }, [user?.$id]);

    // Influencer data merged from LS API and preferences fallback
    const totalRedemptions = lsData?.totalRedemptions || (user?.prefs as any)?.totalRedemptions || 0;
    const approvedCommission = lsData?.approvedCommission || 0;
    const commissionRate = lsData?.commissionRate || 0.3;
    const redemptionsList = lsData?.redemptions || (user?.prefs as any)?.redemptions || [];
    const currency = lsData?.currency || "USD";
    const usageLimit = lsData?.usageLimit ? Number(lsData.usageLimit) : null;
    const usageCount = Math.max(lsData?.usageCount ? Number(lsData.usageCount) : 0, totalRedemptions);

    // Format currency helper - strictly use "$" for a professional look
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

    if (!influencerCode) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center">
                <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <TrendingUp className="w-12 h-12 text-indigo-500" />
                </div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-6">Join our Influencer Program</h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                    Start earning <span className="text-indigo-600 dark:text-indigo-400 font-bold">30% commission</span> on every sale you refer.
                    Get a custom discount code for your audience and track your impact in real-time.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2.5 text-base group"
                    >
                        {isJoining ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        {isJoining ? "Generating..." : "Join Program Now"}
                    </button>
                    <button className="px-8 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all text-base">
                        View Terms
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Influencer Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Track your promotional impact and earned commissions (30% rate).</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm">
                    <div className="px-4 py-2 border-r border-zinc-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Your Code</p>
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

            {/* Stats Grid */}
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
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">30% Rate</span>
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

                    {usageLimit ? (
                        <div className="w-full h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, ((usageCount || 0) / usageLimit) * 100)}%` }}
                            ></div>
                        </div>
                    ) : (
                        <p className="text-xs font-medium text-zinc-400 italic">No usage limit set</p>
                    )}
                </div>
            </div>

            {/* Redemptions Table */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Recent Redemptions
                    </h2>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5">
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Plan Used</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Date</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Order Amount</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Commission (30%)</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                {redemptionsList.length > 0 ? (
                                    redemptionsList.map((red: any, idx: number) => (
                                        <tr key={red.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-medium text-zinc-900 dark:text-white">{red.userEmail}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 uppercase tracking-wider">
                                                    {red.planName}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                                                    {new Date(red.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-bold text-zinc-900 dark:text-white">{formatValue(red.amount)}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`font-bold ${red.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                                                    {red.status === 'Approved' ? `+${formatValue(red.commission)}` : '$0.00'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${red.status === 'Approved'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                    }`}>
                                                    {red.status || 'Pending'}
                                                </span>
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
                                                <div className="space-y-1">
                                                    <p className="font-bold text-zinc-900 dark:text-white">No redemptions yet</p>
                                                    <p className="text-sm text-zinc-500">Sales using your code will appear here in real-time.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payout Info Section */}
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div className="max-w-xl">
                        <h3 className="text-2xl font-bold mb-3">Professional Commission Payouts</h3>
                        <p className="text-indigo-100 leading-relaxed mb-6">
                            Commissions are calculated daily and paid out on the 1st of every month once you exceed the minimum payout threshold ({formatValue(50)}).
                            Ensure your PayPal details are up to date in your primary settings.
                        </p>
                        <button className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2">
                            View Payment Policy <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

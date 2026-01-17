"use client";

import { useAuth } from "@/context/AuthContext";
import { CreditCard, Zap, Calendar, Shield, Crown, Clock, Info } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import PricingModal from "@/components/dashboard/PricingModal";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function BillingPage() {
    const { user } = useAuth();
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [dbTransactions, setDbTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);

    // Dynamic data from user preferences
    const plan = (user?.prefs as any)?.plan || "Free Plan";
    const creditsTotalRaw = (user?.prefs as any)?.creditsTotal || 0;
    const creditsUsed = (user?.prefs as any)?.creditsUsed || 0;
    const creditsTotal = Math.max(0, creditsTotalRaw - creditsUsed);
    const billingCycleEnd = (user?.prefs as any)?.billingCycleEnd ? new Date((user?.prefs as any).billingCycleEnd) : null;

    // Fetch transactions from DB
    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
                const collId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;

                if (dbId && collId) {
                    const response = await databases.listDocuments(
                        dbId,
                        collId,
                        [
                            Query.equal('userId', user.$id),
                            Query.orderDesc('purchasedAt'),
                            Query.limit(100)
                        ]
                    );
                    setDbTransactions(response.documents);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoadingTx(false);
            }
        };

        fetchTransactions();
    }, [user]);

    // Merge Prefs Transactions (Legacy) with DB Transactions (New)
    const prefsTransactions = (user?.prefs as any)?.transactions || [];

    // Normalize DB transactions to match UI expectation
    const normalizedDbTransactions = dbTransactions.map(t => ({
        id: t.transactionId,
        purchasedAt: t.purchasedAt,
        creditsAllotted: t.credits,
        expiresAt: t.expiresAt,
        packageName: t.packageName,
        status: t.status,
        provider: t.provider
    }));

    // Combine and deduplicate
    const combinedTransactions = [...prefsTransactions, ...normalizedDbTransactions]
        .reduce((acc: any[], current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [])
        .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

    const isPro = plan.toLowerCase().includes('pro');
    const isExpired = !!(user?.prefs as any)?.lastPurchaseId && billingCycleEnd && billingCycleEnd < new Date();

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 relative">
            <Suspense fallback={null}>
                <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
            </Suspense>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Billing & Subscription</h1>
                <p className="text-zinc-500 dark:text-zinc-400">View your current plan and transaction history.</p>
            </div>

            {/* Subscription Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-border dark:border-white/5 p-6 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                        <Shield className="w-4 h-4 text-primary" /> Current Plan
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">{plan}</span>
                        {isPro && <Crown className="w-4 h-4 text-primary fill-primary" />}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-border dark:border-white/5 p-6 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                        <Zap className="w-4 h-4 text-primary fill-primary/20" /> Available Credits
                    </div>
                    <span className="text-2xl font-black text-primary">{creditsTotal.toLocaleString()}</span>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-border dark:border-white/5 p-6 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between text-zinc-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" /> Cycle End
                        </div>
                        <div className="group relative">
                            <Info className="w-4 h-4 text-zinc-400 cursor-help hover:text-primary transition-colors" />
                            <div className="absolute top-full right-0 mt-3 w-80 p-5 bg-zinc-900 dark:bg-zinc-800 text-white text-sm rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] border border-white/10 leading-relaxed origin-top-right">
                                <p className="mb-2">
                                    Only the <span className="text-primary font-bold underline underline-offset-4 decoration-primary/30">latest transaction</span> defines your active billing cycle.
                                </p>
                                <p className="text-zinc-400 dark:text-zinc-400">
                                    While credits from all previous purchases remain usable, their individual cycles do not stack or extend the main expiration date.
                                </p>
                            </div>
                        </div>
                    </div>
                    <span className={`text-lg font-bold ${isExpired ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                        {billingCycleEnd ? billingCycleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                    </span>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-border dark:border-white/5 p-6 shadow-sm flex flex-col gap-3 items-center justify-center">
                    <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                    >
                        Buy Credits
                    </button>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" /> Transaction History
                    </h2>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-border dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5">
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Package Details</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Credits</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Purchase Date</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Expiry Date</th>
                                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                {combinedTransactions.length > 0 ? (
                                    combinedTransactions.map((tx: any, idx: number) => {
                                        const txExpired = tx.expiresAt ? new Date(tx.expiresAt) < new Date() : false;
                                        return (
                                            <tr key={tx.id ? `${tx.id}-${idx}` : idx} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                            <Zap className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-bold text-zinc-900 dark:text-white">{tx.packageName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="font-black text-primary">+{tx.creditsAllotted?.toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                                        {new Date(tx.purchasedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                                        {new Date(tx.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${txExpired
                                                        ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                        }`}>
                                                        {txExpired ? "Expired" : "Active"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-3xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                    <CreditCard className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-zinc-900 dark:text-white">No transactions yet</p>
                                                    <p className="text-sm text-zinc-500">Your purchase history will appear here once you buy a pack.</p>
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
        </div>
    );
}

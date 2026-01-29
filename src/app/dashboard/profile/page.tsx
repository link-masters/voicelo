"use client";

import { useAuth } from "@/context/AuthContext";
import { Mail, Shield, Zap, CreditCard, User, Edit2, Calendar, CheckCircle2, AlertCircle, Camera, Crown, MoreVertical, Copy } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import PricingModal from "@/components/dashboard/PricingModal";
import Toast, { ToastType } from "@/components/dashboard/Toast";

export default function ProfilePage() {
    const { user } = useAuth();
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const handleCopyId = async () => {
        if (user?.$id) {
            try {
                await navigator.clipboard.writeText(user.$id);
                setToast({ message: "Account ID copied to clipboard", type: "success" });
                setIsMenuOpen(false);
            } catch (err) {
                setToast({ message: "Failed to copy ID", type: "error" });
            }
        }
    };

    // Dynamic data from user preferences
    const plan = (user?.prefs as any)?.plan || "Free Plan";
    const creditsUsed = (user?.prefs as any)?.creditsUsed || 0;
    const creditsTotal = (user?.prefs as any)?.creditsTotal || 0;
    const creditsPercentage = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0;

    const joinDate = user?.$createdAt
        ? new Date(user.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently';

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Suspense fallback={null}>
                <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
            </Suspense>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header Section */}
            <div className="relative mb-20">
                {/* Cover Image */}
                <div className="h-64 w-full rounded-[2.5rem] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                </div>

                {/* Profile Card Overlay */}
                <div className="absolute left-0 right-0 -bottom-12 px-6 sm:px-10">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200 dark:border-white/5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                            <div className="relative -mt-16 md:-mt-20">
                                <div className="w-32 h-32 rounded-[2rem] p-1.5 bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-zinc-200 dark:ring-white/10">
                                    <div className="w-full h-full rounded-[1.7rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative group">
                                        {(user?.prefs as any)?.avatar ? (
                                            <img
                                                src={(user?.prefs as any).avatar}
                                                alt={user?.name || "User"}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                                                <span className="font-bold text-4xl text-zinc-400 dark:text-zinc-600">
                                                    {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                                                </span>
                                            </div>
                                        )}
                                        <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                            <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center md:text-left pb-1">
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-3 justify-center md:justify-start">
                                    {user?.name || "Guest User"}
                                    {plan !== "Free Plan" && (
                                        <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                            <Crown className="w-4 h-4 fill-amber-500" />
                                        </div>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/5 hover:border-zinc-300 transition-colors">
                                        <Mail className="w-3.5 h-3.5" /> {user?.email}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/5">
                                        <Calendar className="w-3.5 h-3.5" /> Joined {joinDate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="group p-3 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700/50 backdrop-blur-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                >
                                    <MoreVertical className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1">
                                                <button
                                                    onClick={handleCopyId}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors text-left group"
                                                >
                                                    <Copy className="w-4 h-4 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                                                    <span>Copy Account ID</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform duration-300">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${creditsPercentage > 90
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {Math.round(creditsPercentage)}% Used
                                </span>
                            </div>
                            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Credits Usage</h3>
                            <div className="flex items-end gap-2 mb-3">
                                <span className="text-3xl font-bold text-zinc-900 dark:text-white">{creditsUsed.toLocaleString()}</span>
                                <span className="text-sm text-zinc-400 mb-1.5">/ {creditsTotal.toLocaleString()}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${creditsPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    Active
                                </span>
                            </div>
                            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Current Plan</h3>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{plan}</span>
                            </div>
                            <p className="text-sm text-zinc-400">Manage your subscription and billing details</p>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-zinc-400" />
                                Personal Information
                            </h2>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        readOnly
                                        defaultValue={user?.name || ""}
                                        className="w-full bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-white/5 rounded-xl px-5 py-3.5 text-zinc-500 dark:text-zinc-400 cursor-not-allowed font-medium"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            defaultValue={user?.email || ""}
                                            disabled
                                            className="w-full bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-white/5 rounded-xl px-5 py-3.5 text-zinc-500 dark:text-zinc-400 cursor-not-allowed font-medium"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Pro / Credits Card */}
                    {(user?.prefs as any)?.plan !== 'Free Plan' ? (
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 text-white shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md mx-auto">
                                    <Zap className="w-7 h-7 text-amber-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Get More Credits</h3>
                                <p className="opacity-90 mb-8 leading-relaxed">
                                    Running low? Top up your balance to keep generating amazing content.
                                </p>
                                <button
                                    onClick={() => setIsPricingModalOpen(true)}
                                    className="w-full py-4 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-lg"
                                >
                                    Top Up Credits
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-white text-white dark:text-zinc-900 shadow-xl border border-zinc-200/10 dark:border-zinc-200/50">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-[80px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
                            <div className="relative p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-black/5 flex items-center justify-center mb-6 backdrop-blur-md mx-auto">
                                    <Crown className="w-7 h-7 text-amber-400 dark:text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Upgrade to Pro</h3>
                                <p className="opacity-80 mb-8 leading-relaxed">
                                    Get 10x more usage, priority access to new voices, and faster synthesis speeds.
                                </p>
                                <button
                                    onClick={() => setIsPricingModalOpen(true)}
                                    className="w-full py-4 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-lg"
                                >
                                    Upgrade Plan
                                </button>
                            </div>
                        </div>
                    )}



                    {/* Help Card */}
                    <div className="p-6 rounded-[2rem] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 border border-zinc-200 dark:border-white/5 text-center">
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Need Support?</h3>
                        <p className="text-sm text-zinc-500 mb-6">Our team is here to help you with any issues you might face.</p>
                        <Link href="/contact" className="inline-block px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

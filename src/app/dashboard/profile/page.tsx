"use client";

import { useAuth } from "@/context/AuthContext";
import { Mail, Shield, Zap, CreditCard, User, Edit2, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import PricingModal from "@/components/dashboard/PricingModal";

export default function ProfilePage() {
    const { user } = useAuth();
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    // Dynamic data from user preferences
    const plan = (user?.prefs as any)?.plan || "Free Plan";
    const creditsUsed = (user?.prefs as any)?.creditsUsed || 0;
    const creditsTotal = (user?.prefs as any)?.creditsTotal || 0;
    const creditsPercentage = (creditsUsed / creditsTotal) * 100;

    const joinDate = user?.$createdAt
        ? new Date(user.$createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <Suspense fallback={null}>
                <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
            </Suspense>

            {/* Header / Cover */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-sm group">
                <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 mix-blend-overlay"></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="relative flex flex-col md:flex-row justify-between items-end -mt-16 mb-6 gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto">
                            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-900 p-2 shadow-2xl ring-4 ring-white/50 dark:ring-black/50 backdrop-blur-sm">
                                <div className="w-full h-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                                    {(user?.prefs as any)?.avatar ? (
                                        <img
                                            src={(user?.prefs as any).avatar}
                                            alt={user?.name || "User"}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="font-bold text-4xl text-zinc-300 dark:text-zinc-600">
                                            {user?.name ? user.name.charAt(0) : "G"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mb-2">
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{user?.name || "Guest User"}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5">
                                        <Mail className="w-3.5 h-3.5" /> {user?.email}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                                        <Shield className="w-3.5 h-3.5" /> {plan}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-all shadow-lg shadow-zinc-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 btn-primary">
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-100 dark:border-white/5">
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Member Since</p>
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {joinDate}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Account Status</p>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Active
                            </div>
                        </div>
                        <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col justify-center gap-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Plan Usage
                                </span>
                                <span className="text-zinc-900 dark:text-white font-bold">{creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()} Credits</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                    style={{ width: `${creditsPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Account Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" /> Account Management
                    </h2>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Display Name</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        defaultValue={user?.name || ""}
                                        className="flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                    <button className="px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                        Update
                                    </button>
                                </div>
                                <p className="text-sm text-zinc-500">This name will be displayed on your public profile and generated content.</p>
                            </div>

                            <div className="border-t border-zinc-100 dark:border-white/5 pt-8 space-y-4">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                                <div className="flex gap-4">
                                    <input
                                        type="email"
                                        defaultValue={user?.email || ""}
                                        disabled
                                        className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex items-start gap-2 text-sm text-zinc-500">
                                    <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5" />
                                    <span>To change your email address, please contact support for security verification.</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-50/50 dark:bg-white/[0.02] p-6 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-zinc-900 dark:text-white font-medium">Danger Zone</h3>
                                <p className="text-sm text-zinc-500">Irreversible actions regarding your account</p>
                            </div>
                            <button className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Get More Credits</h3>
                            <p className="text-indigo-100 mb-6 text-sm leading-relaxed">
                                Running low? Top up your account with high-quality synthesis credits.
                            </p>
                            <button
                                onClick={() => setIsPricingModalOpen(true)}
                                className="w-full py-3 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                            >
                                Top Up Now
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 p-6">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-500" /> Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">Generated "Welcome Message"</p>
                                        <p className="text-xs text-zinc-500">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { LogOut, User, Settings, ChevronDown, Zap, Lock, CreditCard, Menu } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect usually handled by auth context or protected route wrapper
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const prefs = (user?.prefs as any) || {};
    const creditsUsed = Number(prefs.creditsUsed || 0);
    const creditsTotal = Number(prefs.creditsTotal || 0);

    // Remaining Balance to display
    const creditsBalance = Math.max(0, creditsTotal - creditsUsed);

    // Percentage for the progress bar (Usage / Capacity)
    const creditsPercentage = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

    const creditsDisplay = creditsBalance; // Changed for clarity
    const plan = prefs.plan || "Free Plan";
    const billingCycleEnd = prefs.billingCycleEnd ? new Date(prefs.billingCycleEnd) : null;
    const isExpired = !!prefs.lastPurchaseDate && billingCycleEnd !== null && billingCycleEnd < new Date();

    return (
        <header className="h-20 border-b border-border dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <Link href="/dashboard" className="lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-primary-foreground text-xs">VL</span>
                    </div>
                </Link>

                <div className="hidden lg:block">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 transition-colors line-clamp-1">
                        {(() => {
                            if (pathname === "/dashboard") return "Discover Voices";
                            if (pathname.includes("/text-to-speech")) return "Text to Speech";
                            if (pathname.includes("/voice-clone")) return "Voice Cloning";
                            if (pathname.includes("/profile")) return "Account Profile";
                            if (pathname.includes("/settings")) return "App Settings";
                            if (pathname.includes("/influencer-program")) return "Influencer Program";
                            return "Voice Synthesis Studio";
                        })()}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6">

                <NotificationDropdown />

                {/* Credits Counter */}
                <div className="flex flex-col gap-1.5 mr-1 md:mr-2 items-end">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className={`p-1 rounded-md border shadow-sm ${isExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'}`}>
                            {isExpired ? <Lock className="w-3 h-3 text-red-500" /> : <Zap className="w-3 h-3 text-primary animate-pulse" />}
                        </div>
                        <span className="text-[10px] md:text-sm font-medium transition-colors">
                            {isExpired ? (
                                <span className="text-red-500 font-bold">Locked</span>
                            ) : (
                                <>
                                    <span className="text-zinc-900 dark:text-white font-bold">
                                        <span className="md:hidden">
                                            {creditsDisplay >= 1000 ? `${(creditsDisplay / 1000).toFixed(1)}k` : creditsDisplay}
                                        </span>
                                        <span className="hidden md:inline">
                                            {creditsDisplay.toLocaleString()}
                                        </span>
                                    </span>
                                    <span className="text-zinc-500 ml-1 hidden sm:inline">credits</span>
                                </>
                            )}
                        </span>
                    </div>
                    {/* Expiration warning or progress */}
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-200/50 dark:border-white/5 relative">
                        <div
                            className={`h-full rounded-full transition-all duration-500 relative ${isExpired ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${isExpired ? 100 : Math.max(2, creditsPercentage)}%` }}
                        >
                            {!isExpired && (
                                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 md:gap-3 pl-1 md:pl-3 pr-1 md:pr-2 py-1 md:py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/5 transition-all group"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-zinc-800 dark:text-white group-hover:text-primary transition-colors">
                                {user?.name || "Guest User"}
                            </p>
                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{plan}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center shadow-lg border border-zinc-200 dark:border-white/10 group-hover:border-primary/50 transition-all overflow-hidden relative">
                            {(user?.prefs as any)?.avatar ? (
                                <img
                                    src={(user?.prefs as any).avatar}
                                    alt={user?.name || "User"}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <span className="font-bold text-foreground uppercase text-xs md:text-sm">
                                    {user?.name ? user.name.charAt(0) : "G"}
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-white transition-transform duration-200 hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-border dark:ring-white/5">
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 mb-1 md:hidden">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name || "Guest"}</p>
                                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                            </div>

                            <Link
                                href="/dashboard/billing"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                Billing & Plan
                            </Link>

                            <Link
                                href="/dashboard/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>

                            <div className="border-t border-zinc-100 dark:border-white/5 my-1.5 mx-2"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-2.5 transition-colors rounded-b-lg"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </header >
    )
}

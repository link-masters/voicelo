"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, Settings, User, FileAudio, LayoutDashboard, Compass, Sun, Moon, TrendingUp, ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [isCloneMenuOpen, setIsCloneMenuOpen] = useState(pathname.includes('voice-clone') || pathname.includes('my-voices'));
    const [isEarningsMenuOpen, setIsEarningsMenuOpen] = useState(pathname.includes('influencer-program'));

    const influencerCode = (user?.prefs as any)?.influencerCode;

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-background dark:bg-zinc-950/90 backdrop-blur-xl border-r border-border dark:border-white/10 h-screen fixed left-0 top-0 flex flex-col z-[70] transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 h-20 flex items-center justify-between border-b border-border dark:border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onClose}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white transition-colors">SonicFlow</span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto scrollbar-hide">
                    {/* Home Section */}
                    <div className="space-y-2">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Home
                            </h2>
                        </div>
                        <Link
                            href="/dashboard"
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/dashboard')
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Compass className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>Discover</span>
                        </Link>
                    </div>

                    {/* Generate Speech Section */}
                    <div className="space-y-2">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Generate Speech
                            </h2>
                        </div>
                        <Link
                            href="/dashboard/text-to-speech"
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/dashboard/text-to-speech')
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <FileAudio className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>Text To Speech</span>
                        </Link>
                    </div>

                    {/* Clone Voice Section - Multi-level */}
                    <div className="space-y-1">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Custom Voices
                            </h2>
                        </div>

                        {/* Parent Menu Item - Link + Toggle */}
                        <div className="relative group">
                            <Link
                                href="/dashboard/voice-clone"
                                onClick={() => {
                                    setIsCloneMenuOpen(true);
                                    if (isActive('/dashboard/voice-clone')) onClose?.();
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${isActive('/dashboard/voice-clone')
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Mic className={`w-5 h-5 transition-transform ${isActive('/dashboard/voice-clone') ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span>Voice Clone</span>
                                </div>
                            </Link>

                            {/* Dedicated Toggle Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsCloneMenuOpen(!isCloneMenuOpen);
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isCloneMenuOpen ? 'text-indigo-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCloneMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Submenu Items */}
                        <div className={`overflow-hidden transition-all duration-300 ${isCloneMenuOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-1 py-1">
                                <Link
                                    href="/dashboard/voice-clone"
                                    onClick={onClose}
                                    className={`flex items-center px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/voice-clone')
                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Clone New
                                </Link>
                                <Link
                                    href="/dashboard/my-voices"
                                    onClick={onClose}
                                    className={`flex items-center px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/my-voices')
                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    My Voices
                                </Link>
                                <Link
                                    href="#"
                                    className={`flex items-center px-12 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-400 cursor-not-allowed opacity-50`}
                                >
                                    Voice Settings
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Earnings Section - Multi-level */}
                    <div className="space-y-1">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Earnings
                            </h2>
                        </div>

                        {/* Parent Menu Item - Link + Toggle */}
                        <div className="relative group">
                            <Link
                                href="/dashboard/influencer-program"
                                onClick={() => {
                                    setIsEarningsMenuOpen(true);
                                    if (isActive('/dashboard/influencer-program')) onClose?.();
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${isActive('/dashboard/influencer-program')
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <TrendingUp className={`w-5 h-5 transition-transform ${isActive('/dashboard/influencer-program') ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span>Influencer Hub</span>
                                </div>
                            </Link>

                            {/* Dedicated Toggle Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsEarningsMenuOpen(!isEarningsMenuOpen);
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isEarningsMenuOpen ? 'text-indigo-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isEarningsMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Submenu Items */}
                        <div className={`overflow-hidden transition-all duration-300 ${isEarningsMenuOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-1 py-1">
                                <Link
                                    href="/dashboard/influencer-program"
                                    onClick={onClose}
                                    className={`flex items-center px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/influencer-program')
                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Overview
                                </Link>
                                <Link
                                    href="/dashboard/influencer-program/verify"
                                    onClick={onClose}
                                    className={`flex items-center px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/influencer-program/verify')
                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Verify
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border dark:border-white/5">
                        <Link href="#" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 font-medium transition-all group">
                            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Settings</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-border dark:border-white/5 bg-secondary/50 dark:bg-black/20 space-y-1 shrink-0">
                    <div className="px-4 mb-2">
                        <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                            Preferences
                        </h2>
                    </div>
                    <button
                        onClick={() => {
                            toggleTheme();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 font-medium transition-all group"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <Link href="/" onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 font-medium transition-all group">
                        <User className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

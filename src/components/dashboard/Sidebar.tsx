"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, Settings, Home, FileAudio, LayoutDashboard, Compass, Sun, Moon, TrendingUp, ChevronDown, X, ShieldAlert, AudioWaveform, Plus, AudioLines, LayoutGrid, BadgeCheck, Folder, Sparkles, History } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

import { useProject } from '@/context/ProjectContext';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [isCloneMenuOpen, setIsCloneMenuOpen] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [isEarningsMenuOpen, setIsEarningsMenuOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);

    // Sync submenus with pathname, ensuring mutual exclusivity
    React.useEffect(() => {
        const isClonePath = pathname.includes('voice-clone') || pathname.includes('my-voices');
        const isProjectsPath = pathname.includes('/dashboard/projects') && pathname !== '/dashboard/projects'; // Open only if inside a specific project
        const isMainProjectsPath = pathname === '/dashboard/projects';
        const isAiPath = pathname.includes('ai-writer') || pathname.includes('ai-history');

        if (isClonePath) {
            setIsCloneMenuOpen(true);
            setIsProjectsMenuOpen(false);
            setIsAiMenuOpen(false);
        } else if (isProjectsPath || isMainProjectsPath) {
            setIsProjectsMenuOpen(true);
            setIsCloneMenuOpen(false);
            setIsAiMenuOpen(false);
        } else if (isAiPath) {
            setIsAiMenuOpen(true);
            setIsCloneMenuOpen(false);
            setIsProjectsMenuOpen(false);
        } else {
            // Optional: close all if on a neutral path like Discover
            setIsCloneMenuOpen(false);
            setIsProjectsMenuOpen(false);
            setIsAiMenuOpen(false);
        }
    }, [pathname]);

    React.useEffect(() => {
        if (user) {
            const fetchProjects = async () => {
                try {
                    const response = await databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        'projects',
                        [
                            Query.equal('userId', user.$id),
                            Query.orderDesc('$createdAt'),
                            Query.limit(5) // Show top 5 recent
                        ]
                    );
                    setProjects(response.documents);
                } catch (error) {
                    console.error('Failed to fetch sidebar projects', error);
                }
            };
            fetchProjects();
        }
    }, [user]);

    // const influencerCode = (user?.prefs as any)?.influencerCode;




    const isActive = (path: string) => pathname === path;
    const { attemptNavigation } = useProject(); // Consume Hook

    const handleLinkClick = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        onClose?.();
        attemptNavigation(href);
    };

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
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <AudioWaveform className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white transition-colors">VoiceLo</span>
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
                            onClick={(e) => handleLinkClick(e, '/dashboard')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/dashboard')
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Compass className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>Discover</span>
                        </Link>
                        <div className="relative group">
                            <Link
                                href="/dashboard/projects"
                                onClick={(e) => {
                                    handleLinkClick(e, '/dashboard/projects');
                                    setIsProjectsMenuOpen(true);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full ${isActive('/dashboard/projects') && pathname === '/dashboard/projects'
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <Folder className={`w-5 h-5 transition-transform ${isProjectsMenuOpen ? 'text-primary' : 'group-hover:scale-110'}`} />
                                <span>Projects</span>
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const nextState = !isProjectsMenuOpen;
                                    setIsProjectsMenuOpen(nextState);
                                    if (nextState) {
                                        setIsCloneMenuOpen(false);
                                        setIsAiMenuOpen(false);
                                    }
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isProjectsMenuOpen ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProjectsMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Projects Submenu */}
                        <div className={`overflow-hidden transition-all duration-300 ${isProjectsMenuOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-1 py-1">
                                {projects.map((project) => (
                                    <Link
                                        key={project.$id}
                                        href={`/dashboard/projects/${project.$id}`}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm font-medium transition-all ${pathname === `/dashboard/projects/${project.$id}`
                                            ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white translate-x-1'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pathname === `/dashboard/projects/${project.$id}` ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400'}`} />
                                        <span className="truncate">{project.name}</span>
                                    </Link>
                                ))}
                                {projects.length === 0 && (
                                    <div className="px-12 py-2 text-xs text-zinc-400 italic">No projects yet</div>
                                )}
                                <div className="pt-1 px-6 border-t border-zinc-100/5 dark:border-white/5 mt-1">
                                    <Link
                                        href="/dashboard/projects"
                                        onClick={onClose}
                                        className="block text-center py-2 text-[10px] font-bold tracking-wide text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg transition-all"
                                    >
                                        View All Projects
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Creative Studio Section */}
                    <div className="space-y-1">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Creative Studio
                            </h2>
                        </div>

                        <div className="relative group">
                            <Link
                                href="/dashboard/ai-writer"
                                onClick={() => {
                                    setIsAiMenuOpen(true);
                                    if (pathname.includes('/dashboard/ai-writer')) onClose?.();
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${pathname.includes('/dashboard/ai-writer') || pathname.includes('ai-history')
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles className={`w-5 h-5 transition-transform ${pathname.includes('/dashboard/ai-writer') ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span>AI Writer</span>
                                </div>
                            </Link>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const nextState = !isAiMenuOpen;
                                    setIsAiMenuOpen(nextState);
                                    if (nextState) {
                                        setIsCloneMenuOpen(false);
                                        setIsProjectsMenuOpen(false);
                                    }
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isAiMenuOpen ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isAiMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* AI Submenu */}
                        <div className={`overflow-hidden transition-all duration-300 ${isAiMenuOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-1 py-1">
                                <Link
                                    href="/dashboard/ai-history"
                                    onClick={onClose}
                                    className={`flex items-center gap-2 px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/ai-history')
                                        ? 'text-primary bg-primary/5 font-bold'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <History className="w-4 h-4" />
                                    History
                                </Link>
                            </div>
                        </div>
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
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
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
                                    e.stopPropagation();
                                    const nextState = !isCloneMenuOpen;
                                    setIsCloneMenuOpen(nextState);
                                    if (nextState) setIsProjectsMenuOpen(false);
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isCloneMenuOpen ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
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
                                    className={`flex items-center gap-2 px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/voice-clone')
                                        ? 'text-primary bg-primary/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Clone New
                                </Link>
                                <Link
                                    href="/dashboard/my-voices"
                                    onClick={onClose}
                                    className={`flex items-center gap-2 px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/my-voices')
                                        ? 'text-primary bg-primary/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <AudioLines className="w-4 h-4" />
                                    My Voices
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* 
                    <div className="space-y-1">
                        <div className="px-4 mb-3">
                            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                Earnings
                            </h2>
                        </div>

                        <div className="relative group">
                            <Link
                                href="/dashboard/influencer-program"
                                onClick={() => {
                                    setIsEarningsMenuOpen(true);
                                    if (isActive('/dashboard/influencer-program')) onClose?.();
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${isActive('/dashboard/influencer-program')
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <TrendingUp className={`w-5 h-5 transition-transform ${isActive('/dashboard/influencer-program') ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span>Influencer Program</span>
                                </div>
                            </Link>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsEarningsMenuOpen(!isEarningsMenuOpen);
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 ${isEarningsMenuOpen ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isEarningsMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ${isEarningsMenuOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-1 py-1">
                                <Link
                                    href="/dashboard/influencer-program"
                                    onClick={onClose}
                                    className={`flex items-center gap-2 px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/influencer-program')
                                        ? 'text-primary bg-primary/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Overview
                                </Link>
                                <Link
                                    href="/dashboard/influencer-program/verify"
                                    onClick={onClose}
                                    className={`flex items-center gap-2 px-12 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive('/dashboard/influencer-program/verify')
                                        ? 'text-primary bg-primary/5'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <BadgeCheck className="w-4 h-4" />
                                    Verify
                                </Link>
                            </div>
                        </div>
                    </div> 
                    */}
                    {/* Admin Section */}
                    {((user?.prefs as any)?.isAdmin === true || (user?.prefs as any)?.isAdmin === "true") && (
                        <div className="space-y-2">
                            <div className="px-4 mb-3">
                                <h2 className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">
                                    Administration
                                </h2>
                            </div>
                            <Link
                                href="/dashboard/admin/notifications"
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/dashboard/admin/notifications')
                                    ? 'bg-red-500/10 text-red-600 border border-red-500/30 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 border border-transparent'
                                    }`}
                            >
                                <ShieldAlert className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span>Broadcasts</span>
                            </Link>
                        </div>
                    )}

                    <div className="pt-6 border-t border-border dark:border-white/5">
                        <Link
                            href="/dashboard/settings"
                            onClick={(e) => handleLinkClick(e, '/dashboard/settings')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/dashboard/settings')
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Settings className={`w-5 h-5 transition-transform ${isActive('/dashboard/settings') ? 'rotate-90' : 'group-hover:rotate-90'}`} />
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
                    <Link href="/" onClick={(e) => handleLinkClick(e, '/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 font-medium transition-all group">
                        <Home className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

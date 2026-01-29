"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import {
    Settings,
    User,
    Moon,
    Sun,
    Zap,
    Trash2,
    Volume2,
    PlayCircle,
    Mail,
    Bell,
    Shield,
    Database,
    CheckCircle2,
    Loader2,
    Edit3,
    ArrowRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clearAllHistory, deleteUserAccountEntirely, updateUserName } from "@/app/actions";
import ConfirmationModal from "@/components/dashboard/ConfirmationModal";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addNotification } = useNotifications();
    const [isClearing, setIsClearing] = useState(false);

    // Active tab state
    const [activeTab, setActiveTab] = useState('account');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const { logout } = useAuth();
    const router = useRouter();

    // Local settings state (persisted in localStorage)
    const [ttsDefaults, setTtsDefaults] = useState({
        rate: 1,
        pitch: 1,
        volume: 1,
        autoplay: true
    });

    const [notifications, setNotifications] = useState({
        marketing: true,
        security: true,
        usage: true
    });

    // Tab navigation items
    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Sun },
        { id: 'tts', label: 'Voice Studio', icon: Volume2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'data', label: 'Data & Privacy', icon: Database },
    ];

    // Handle tab click - scroll to section
    // Handle tab click
    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    // Load settings on mount
    useEffect(() => {
        const savedTts = localStorage.getItem('voicelo_tts_settings');
        if (savedTts) {
            try {
                setTtsDefaults(JSON.parse(savedTts));
            } catch (e) {
                console.error("Failed to load TTS settings", e);
            }
        }

        const savedNotifs = localStorage.getItem('voicelo_notification_settings');
        if (savedNotifs) {
            try {
                setNotifications(JSON.parse(savedNotifs));
            } catch (e) {
                console.error("Failed to load notifications", e);
            }
        }
    }, []);



    // Save functions
    const saveTtsSetting = (key: string, value: any) => {
        const newSettings = { ...ttsDefaults, [key]: value };
        setTtsDefaults(newSettings);
        localStorage.setItem('voicelo_tts_settings', JSON.stringify(newSettings));
    };

    const saveNotifSetting = (key: string, value: any) => {
        const newSettings = { ...notifications, [key]: value };
        setNotifications(newSettings);
        localStorage.setItem('voicelo_notification_settings', JSON.stringify(newSettings));
    };

    const clearHistory = async () => {
        if (!user?.$id) {
            addNotification({
                title: "Error",
                message: "You must be logged in to clear history.",
                type: "error"
            });
            return;
        }

        try {
            setIsClearing(true);
            const result = await clearAllHistory(user.$id);

            if (result.success) {
                // Clear all history from storage (global and project-specific)
                if (typeof window !== 'undefined') {
                    // LocalStorage cleanup
                    localStorage.removeItem('tts_history');
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('tts_history_')) {
                            localStorage.removeItem(key);
                        }
                    });

                    // SessionStorage cleanup (where project history is active)
                    sessionStorage.removeItem('tts_history');
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.startsWith('tts_history_')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                }

                addNotification({
                    title: "History Cleared",
                    message: "All generation history has been permanently removed from the cloud and local cache.",
                    type: "success"
                });
                setShowClearConfirm(false);
            } else {
                addNotification({
                    title: "Clear Failed",
                    message: result.error || "Failed to clear history. Please try again.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Clear history error:", error);
            addNotification({
                title: "System Error",
                message: "An unexpected error occurred. Please try again later.",
                type: "error"
            });
        } finally {
            setIsClearing(false);
        }
    };

    const resetDefaults = () => {
        const defaults = { rate: 1, pitch: 1, volume: 1, autoplay: true };
        setTtsDefaults(defaults);
        localStorage.setItem('voicelo_tts_settings', JSON.stringify(defaults));
        addNotification({
            title: "Settings Reset",
            message: "All preferences have been restored to default values.",
            type: "success"
        });
    };

    const handleUpdateName = async () => {
        if (!user?.$id || !newName.trim() || newName === user?.name) {
            setIsEditingName(false);
            return;
        }

        try {
            setIsUpdatingName(true);
            const result = await updateUserName(user.$id, newName.trim());

            if (result.success) {
                await refreshUser();
                addNotification({
                    title: "Profile Updated",
                    message: "Your name has been successfully updated.",
                    type: "success"
                });
                setIsEditingName(false);
            } else {
                addNotification({
                    title: "Update Failed",
                    message: result.error || "Failed to update your name. Please try again.",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Update name error:", error);
            addNotification({
                title: "System Error",
                message: "An unexpected error occurred. Please try again later.",
                type: "error"
            });
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user?.$id || isDeleting) return;

        try {
            setIsDeleting(true);
            const result = await deleteUserAccountEntirely(user.$id);

            if (result.success) {
                addNotification({
                    title: "Account Deleted",
                    message: "Your account and all associated data have been permanently removed.",
                    type: "success"
                });

                // Clear session and force full reload to landing page
                // This is the safest way to clear all memory state, 
                // context providers, and cached data after account deletion.
                try {
                    await logout();
                } catch (e) {
                    console.error("Logout during deletion failed:", e);
                }

                // Nuclear option: hard redirect
                window.location.href = '/';
            } else {
                addNotification({
                    title: "Deletion Failed",
                    message: result.error || "Failed to delete account. Please contact support.",
                    type: "error"
                });
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Delete account error:", error);
            addNotification({
                title: "System Error",
                message: "An unexpected error occurred. Please try again later.",
                type: "error"
            });
            setIsDeleting(false);
        } finally {
            // We don't reset isDeleting if successful as we are navigating away
            setShowDeleteAccountConfirm(false);
        }
    };

    return (
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Settings className="w-8 h-8 text-primary" />
                    </div>
                    Settings
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 ml-14">
                    Manage your account preferences and application behavior.
                </p>
            </div>

            {/* Tabs Header */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-1">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`
                            relative px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all
                            ${activeTab === item.id
                                ? 'text-primary'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }
                        `}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {activeTab === item.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">

                {/* Account Settings */}
                {activeTab === 'account' && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Account Profile
                            </h2>
                        </div>
                        <div className="p-8 space-y-12">
                            {/* Profile Info Row */}
                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                {/* Avatar */}
                                <div className="shrink-0 relative">
                                    <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden shadow-inner">
                                        {(user?.prefs as any)?.avatar ? (
                                            <img src={(user?.prefs as any).avatar} alt={user?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-primary/30" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-white/10 shadow-lg">
                                        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-800" />
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="flex-1 w-full space-y-6 max-w-2xl">
                                    {/* Full Name Field */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className={`px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border ${isEditingName ? 'border-primary ring-4 ring-primary/10' : 'border-zinc-200 dark:border-white/5 group-hover:border-zinc-300 dark:group-hover:border-white/10'} rounded-2xl text-zinc-900 dark:text-white font-medium flex items-center gap-3 transition-all duration-300`}>
                                                <User className={`w-5 h-5 ${isEditingName ? 'text-primary' : 'text-zinc-400'}`} />
                                                <input
                                                    ref={nameInputRef}
                                                    type="text"
                                                    value={isEditingName ? newName : (user?.name || 'User')}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    readOnly={!isEditingName}
                                                    className="bg-transparent border-none outline-none w-full p-0 text-base focus:ring-0 placeholder:text-zinc-400"
                                                    placeholder="Enter your name"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && isEditingName && newName !== user?.name) {
                                                            handleUpdateName();
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setIsEditingName(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!isEditingName) {
                                                    setNewName(user?.name || "");
                                                    setIsEditingName(true);
                                                    setTimeout(() => nameInputRef.current?.focus(), 100);
                                                } else if (newName !== user?.name) {
                                                    handleUpdateName();
                                                } else {
                                                    setIsEditingName(false);
                                                }
                                            }}
                                            disabled={isUpdatingName}
                                            className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 ${isEditingName
                                                ? (newName !== user?.name ? 'bg-primary text-white shadow-xl shadow-primary/30 hover:bg-primary-hover' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10')
                                                : 'text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20'
                                                }`}
                                        >
                                            {isUpdatingName ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : isEditingName ? (
                                                newName !== user?.name ? (
                                                    <>Update Name <ArrowRight className="w-3.5 h-3.5" /></>
                                                ) : 'Cancel Edit'
                                            ) : (
                                                <><Edit3 className="w-3.5 h-3.5" /> Edit Profile Name</>
                                            )}
                                        </button>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 rounded-2xl flex items-center justify-between group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-zinc-400" />
                                                <span className="text-zinc-900 dark:text-zinc-200 font-medium">{user?.email}</span>
                                            </div>
                                            {user?.emailVerification && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-10 border-t border-zinc-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </div>
                                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
                                </div>
                                <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-red-500/10">
                                    <div className="text-center md:text-left">
                                        <p className="font-bold text-lg text-zinc-900 dark:text-white">Delete Account Permanentally</p>
                                        <p className="text-sm text-zinc-500 mt-2 max-w-md">
                                            This will immediately wipe your speech history, credits, and AI memory. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteAccountConfirm(true)}
                                        className="whitespace-nowrap px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-red-500/30 transition-all hover:scale-[1.05] active:scale-95"
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Appearance */}
                {activeTab === 'appearance' && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Sun className="w-5 h-5 text-primary" /> Appearance
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Theme Mode</p>
                                    <p className="text-xs text-zinc-500">Choose between light and dark backgrounds</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl transition-all hover:border-primary/50"
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Moon className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">Dark Mode</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sun className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium">Light Mode</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* TTS Studio Defaults */}
                {activeTab === 'tts' && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Volume2 className="w-5 h-5 text-primary" /> Voice Studio Defaults
                            </h2>
                            <button
                                onClick={resetDefaults}
                                className="text-xs text-zinc-500 hover:text-primary transition-colors font-medium"
                            >
                                Reset to Default
                            </button>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Auto Play */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Auto-play Generation</p>
                                    <p className="text-xs text-zinc-500">Automatically play audio after it is synthesized</p>
                                </div>
                                <button
                                    onClick={() => saveTtsSetting('autoplay', !ttsDefaults.autoplay)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${ttsDefaults.autoplay ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${ttsDefaults.autoplay ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            {/* Default Speed */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-white">Default Speaking Rate</label>
                                    <span className="text-xs font-mono text-primary font-bold">{ttsDefaults.rate}x</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2" step="0.1"
                                    value={ttsDefaults.rate}
                                    onChange={(e) => saveTtsSetting('rate', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                    <span>Slower</span>
                                    <span>Normal (1.0)</span>
                                    <span>Faster</span>
                                </div>
                            </div>

                            {/* Default Pitch */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-white">Default Voice Pitch</label>
                                    <span className="text-xs font-mono text-primary font-bold">{ttsDefaults.pitch}</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2" step="0.1"
                                    value={ttsDefaults.pitch}
                                    onChange={(e) => saveTtsSetting('pitch', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                    <span>Deep</span>
                                    <span>Normal (1.0)</span>
                                    <span>High</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" /> Notifications
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {[
                                { id: 'marketing', label: 'Updates & Announcements', desc: 'Get notified about new features and voices' },
                                { id: 'usage', label: 'Usage Alerts', desc: 'Notify me when I reach 80% of my credits' },
                                { id: 'security', label: 'Security Alerts', desc: 'Critical alerts about your account login and security' },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-white text-sm">{item.label}</p>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => saveNotifSetting(item.id, !(notifications as any)[item.id])}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${(notifications as any)[item.id] ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${(notifications as any)[item.id] ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Data & Privacy */}
                {activeTab === 'data' && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" /> Data & Privacy
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Clear Generation History</p>
                                    <p className="text-xs text-zinc-500">Permanently delete all TTS and AI generated history from the cloud.</p>
                                </div>
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    disabled={isClearing}
                                    className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    {isClearing ? (
                                        <Loader2 className="w-3.5 h-3.5 inline mr-1.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                                    )}
                                    {isClearing ? 'Clearing...' : 'Clear History'}
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={clearHistory}
                isLoading={isClearing}
                title="Clear Generation History"
                description="Are you sure you want to clear ALL generation history from all projects? This action cannot be undone and will remove both TTS audio and AI writer history."
                confirmText="Permanently Delete"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showDeleteAccountConfirm}
                onClose={() => setShowDeleteAccountConfirm(false)}
                onConfirm={handleDeleteAccount}
                isLoading={isDeleting}
                title="Delete Account Permanently"
                description="This will permanently delete your account and all associated data including credits, voice clones, and generation history. This action belongs to the IRREVERSIBLE category. Are you absolutely sure?"
                confirmText="Yes, Delete My Account"
                variant="danger"
            />
        </div>
    );
}

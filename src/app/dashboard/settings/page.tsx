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
    Monitor,
    Bell,
    Shield,
    Database,
    CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addNotification } = useNotifications();

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

    const clearHistory = () => {
        if (confirm("Are you sure you want to clear your generation history? This action cannot be undone.")) {
            localStorage.removeItem('tts_history');
            addNotification({
                title: "History Cleared",
                message: "Generation history has been permanently removed.",
                type: "success"
            });
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

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Navigation (Visual Only for now) */}
                <div className="space-y-1">
                    {[
                        { id: 'general', label: 'General', icon: User },
                        { id: 'appearance', label: 'Appearance', icon: Sun },
                        { id: 'tts', label: 'Voice Studio', icon: Volume2 },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'data', label: 'Data & Privacy', icon: Database },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-all ${item.id === 'general'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Main Settings Content */}
                <div className="md:col-span-2 space-y-8">

                    {/* Appearance */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-primary" /> Appearance
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

                    {/* TTS Studio Defaults */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
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

                    {/* Notifications */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
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

                    {/* Data & Privacy */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" /> Data & Privacy
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Clear Generation History</p>
                                    <p className="text-xs text-zinc-500">This will remove all your local TTS history</p>
                                </div>
                                <button
                                    onClick={clearHistory}
                                    className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                                    Clear History
                                </button>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

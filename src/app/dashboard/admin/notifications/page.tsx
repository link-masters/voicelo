"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { createBroadcast } from "@/app/actions";
import {
    Send,
    Bell,
    ShieldAlert,
    Info,
    CheckCircle2,
    AlertTriangle,
    Settings,
    Loader2
} from "lucide-react";

export default function AdminNotificationsPage() {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "info" as "info" | "success" | "warning" | "error" | "system",
        category: "general"
    });

    const isAdmin = (user?.prefs as any)?.isAdmin === true || (user?.prefs as any)?.isAdmin === "true";

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Denied</h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
                    You do not have administrative privileges to access this page.
                    Please contact the system administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.message) return;

        setIsSubmitting(true);
        try {
            await createBroadcast({
                title: formData.title,
                message: formData.message,
                type: formData.type,
                category: formData.category
            });

            addNotification({
                title: "Broadcast Sent",
                message: "General notification has been dispatched to all users successfully.",
                type: "success"
            });

            setFormData({
                title: "",
                message: "",
                type: "info",
                category: "general"
            });
        } catch (error: any) {
            addNotification({
                title: "Broadcast Failed",
                message: error.message || "Failed to send broadcast notification.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const notificationTypes = [
        { id: "info", label: "Information", icon: Info, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { id: "success", label: "Success", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
        { id: "error", label: "Critical / Error", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
        { id: "system", label: "System update", icon: Settings, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Bell className="w-8 h-8 text-indigo-500" />
                    </div>
                    Global Broadcasts
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 ml-14">
                    Send a general notification to all users across the platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 h-fit space-y-4">
                    <h3 className="font-bold text-zinc-900 dark:text-white">How it works</h3>
                    <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <li className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            Global broadcasts are stored in Appwrite and fetched by all active clients.
                        </li>
                        <li className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            Users will see this as an unread notification in their bell menu.
                        </li>
                        <li className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            Each notification is only shown once to any specific device.
                        </li>
                    </ul>
                </div>

                {/* Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                            <h2 className="font-bold text-zinc-900 dark:text-white">Compose Broadcast</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notification Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. System Maintenance Scheduled"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Detailed Message</label>
                                <textarea
                                    placeholder="Provide more context here..."
                                    rows={4}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notification Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {notificationTypes.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t.id as any })}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.type === t.id
                                                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500'
                                                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${t.bg}`}>
                                                <t.icon className={`w-4 h-4 ${t.color}`} />
                                            </div>
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-white/5 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.title || !formData.message}
                                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

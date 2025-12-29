"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Settings } from "lucide-react";
import {
    getActiveBroadcasts,
    getUserNotifications,
    createUserNotification,
    markNotificationSync,
    deleteNotificationSync,
    updateUserSeenBroadcasts
} from "@/app/actions";
import { useAuth } from "@/context/AuthContext";

export type NotificationType = "info" | "success" | "warning" | "error" | "system";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: number;
    read: boolean;
    category?: "marketing" | "usage" | "security" | "general";
}

interface Toast {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">, showToast?: boolean) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeToast, setActiveToast] = useState<Toast | null>(null);

    // Initial Load
    useEffect(() => {
        if (user) {
            syncAllData();
        } else {
            const saved = localStorage.getItem("voicelo_notifications");
            if (saved) setNotifications(JSON.parse(saved));
        }
    }, [user]);

    const syncAllData = async () => {
        if (!user) return;

        try {
            // 1. Fetch Global Broadcasts
            const broadcasts = await getActiveBroadcasts();
            const processedIds = ((user.prefs as any)?.processedBroadcasts as string[]) || [];

            // 2. Identify and clone NEW broadcasts to this user's personal collection
            const newBroadcasts = broadcasts.filter(b => !processedIds.includes(b.id));

            if (newBroadcasts.length > 0) {
                for (const b of newBroadcasts) {
                    await createUserNotification(user.$id, {
                        title: b.title,
                        message: b.message,
                        type: b.type,
                        category: b.category || 'general'
                    });
                }

                // Track these as processed in user prefs
                const updatedProcessed = Array.from(new Set([...processedIds, ...newBroadcasts.map(b => b.id)]));
                await updateUserSeenBroadcasts(user.$id, updatedProcessed);
            }

            // 3. Fetch all personal notifications
            const personal = await getUserNotifications(user.$id);

            // Deduplicate and Cleanup previous glitches
            const uniqueNotifications: Notification[] = [];
            const seenContent = new Set<string>();
            const duplicatesToDelete: string[] = [];

            for (const n of personal) {
                const contentKey = `${n.title}-${n.message}`.toLowerCase();
                if (!seenContent.has(contentKey)) {
                    uniqueNotifications.push(n);
                    seenContent.add(contentKey);
                } else {
                    // This is a duplicate record in the DB from the previous bug
                    duplicatesToDelete.push(n.id);
                }
            }

            // Sync state and run background cleanup
            setNotifications(uniqueNotifications.slice(0, 50));

            if (duplicatesToDelete.length > 0) {
                Promise.all(duplicatesToDelete.map(id => deleteNotificationSync(id)))
                    .catch(err => console.debug("Cleanup minor error:", err));
            }

        } catch (error) {
            console.error("Sync failed:", error);
        }
    };

    const addNotification = useCallback(async (notif: Omit<Notification, "id" | "timestamp" | "read">, showToastEffect: boolean = true) => {
        if (user) {
            const doc = await createUserNotification(user.$id, notif);
            if (doc) {
                const newNotif: Notification = {
                    ...notif,
                    id: doc.$id,
                    timestamp: Date.now(),
                    read: false,
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 50));
            }
        } else {
            const id = uuidv4();
            const newNotif: Notification = { ...notif, id, timestamp: Date.now(), read: false };
            setNotifications(prev => {
                const updated = [newNotif, ...prev].slice(0, 50);
                localStorage.setItem("voicelo_notifications", JSON.stringify(updated));
                return updated;
            });
        }

        if (showToastEffect) {
            setActiveToast({ id: uuidv4(), message: notif.message, type: notif.type });
            setTimeout(() => setActiveToast(null), 5000);
        }
    }, [user]);

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        if (user) await markNotificationSync(id, true);
        else {
            setNotifications(prev => {
                const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
                localStorage.setItem("voicelo_notifications", JSON.stringify(updated));
                return updated;
            });
        }
    }, [user]);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (user) {
            for (const n of notifications) {
                if (!n.read) await markNotificationSync(n.id, true);
            }
        } else {
            setNotifications(prev => {
                const updated = prev.map(n => ({ ...n, read: true }));
                localStorage.setItem("voicelo_notifications", JSON.stringify(updated));
                return updated;
            });
        }
    }, [user, notifications]);

    const clearNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (user) await deleteNotificationSync(id);
        else {
            setNotifications(prev => {
                const updated = prev.filter(n => n.id !== id);
                localStorage.setItem("voicelo_notifications", JSON.stringify(updated));
                return updated;
            });
        }
    }, [user]);

    const clearAll = useCallback(async () => {
        setNotifications([]);
        if (user) {
            for (const n of notifications) {
                await deleteNotificationSync(n.id);
            }
        } else {
            localStorage.removeItem("voicelo_notifications");
        }
    }, [user, notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotification,
            clearAll
        }}>
            {children}
            {activeToast && (
                <ToastComponent
                    message={activeToast.message}
                    type={activeToast.type}
                    onClose={() => setActiveToast(null)}
                />
            )}
        </NotificationContext.Provider>
    );
};

const ToastComponent = ({ message, type, onClose }: { message: string, type: NotificationType, onClose: () => void }) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-indigo-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        system: <Settings className="w-5 h-5 text-purple-500" />,
    };

    const backgrounds = {
        success: "bg-white dark:bg-zinc-900 border-emerald-500/20 shadow-emerald-500/10",
        error: "bg-white dark:bg-zinc-900 border-red-500/20 shadow-red-500/10",
        info: "bg-white dark:bg-zinc-900 border-indigo-500/20 shadow-indigo-500/10",
        warning: "bg-white dark:bg-zinc-900 border-amber-500/20 shadow-amber-500/10",
        system: "bg-white dark:bg-zinc-900 border-purple-500/20 shadow-purple-500/10",
    };

    return (
        <div className={`fixed top-24 right-6 z-[100] flex items-center gap-4 px-4 py-3 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full ${backgrounds[type]}`}>
            <div className="shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                    {message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-zinc-100 dark:bg-white/5 w-full rounded-b-2xl overflow-hidden">
                <div
                    className={`h-full transition-all duration-linear ${type === 'success' ? 'bg-emerald-500' :
                        type === 'error' ? 'bg-red-500' :
                            type === 'info' ? 'bg-indigo-500' :
                                type === 'warning' ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                    style={{
                        animation: `toast-progress 5000ms linear forwards`
                    }}
                />
            </div>
            <style jsx>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Bell,
    Check,
    Trash2,
    Info,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Settings,
    X,
    Eye,
    ExternalLink
} from "lucide-react";
import { useNotifications, Notification, NotificationType } from "@/context/NotificationContext";
import Link from "next/link";
import ModalPortal from "./ModalPortal";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll
    } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case "info": return <Info className="w-4 h-4 text-primary" />;
            case "system": return <Settings className="w-4 h-4 text-secondary-foreground" />;
            default: return <Bell className="w-4 h-4 text-zinc-500" />;
        }
    };

    const getTypeStyles = (type: NotificationType, read: boolean) => {
        if (read) return "bg-zinc-100/50 dark:bg-white/5 opacity-80";
        switch (type) {
            case "success": return "bg-emerald-500/10 border-emerald-500/20";
            case "error": return "bg-red-500/10 border-red-500/20";
            case "warning": return "bg-amber-500/10 border-amber-500/20";
            case "info": return "bg-primary/10 border-primary/20";
            case "system": return "bg-secondary border-border shadow-sm";
            default: return "bg-zinc-500/10 border-zinc-500/20";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-full transition-all duration-300 group ${isOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm shadow-red-500/50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-[380px] bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Notifications</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">You have {unreadCount} unread messages</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="p-2 text-zinc-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                                    title="Mark all as read"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => clearAll()}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/5"
                                title="Clear all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-zinc-100 dark:divide-white/5">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => {
                                            setSelectedNotif(notif);
                                            if (!notif.read) markAsRead(notif.id);
                                        }}
                                        className={`group relative p-5 transition-all duration-300 cursor-pointer border-b border-zinc-100 dark:border-white/5 last:border-0 ${!notif.read
                                            ? 'bg-primary/5 hover:bg-primary/10'
                                            : 'bg-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.02] opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="relative shrink-0">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${getTypeStyles(notif.type, notif.read)} group-hover:scale-110 group-hover:rotate-3`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                {!notif.read && (
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-zinc-900 shadow-sm animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className={`text-sm font-bold truncate transition-colors ${notif.read
                                                        ? 'text-zinc-500 dark:text-zinc-500'
                                                        : 'text-zinc-900 dark:text-white'
                                                        }`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] font-medium text-zinc-400 font-mono">
                                                        {formatTime(notif.timestamp)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed line-clamp-2 transition-colors ${notif.read
                                                    ? 'text-zinc-400 dark:text-zinc-600'
                                                    : 'text-zinc-600 dark:text-zinc-300'
                                                    }`}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions overlay */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedNotif(notif);
                                                    if (!notif.read) markAsRead(notif.id);
                                                }}
                                                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-primary hover:scale-110 shadow-sm transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notif.id);
                                                }}
                                                className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-red-400 hover:scale-110 shadow-sm transition-all"
                                                title="Delete"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 px-10 text-center">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-white/10 group-hover:scale-110 transition-transform">
                                    <Bell className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                                </div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">No notifications yet</h4>
                                <p className="text-xs text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
                                    When you have news or updates, they'll show up here.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 text-center">
                        <Link
                            href="/dashboard/settings"
                            className="text-xs font-bold text-primary hover:opacity-80 transition-colors inline-flex items-center gap-1.5 group"
                            onClick={() => setIsOpen(false)}
                        >
                            Notification Settings
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Notification Detail Modal */}
            <NotificationDetailsModal
                notification={selectedNotif}
                onClose={() => setSelectedNotif(null)}
                getIcon={getIcon}
                getTypeStyles={getTypeStyles}
                formatTime={formatTime}
            />

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(161, 161, 170, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.4);
                }
                
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                .animate-wiggle {
                    animation: wiggle 0.5s ease-in-out infinite alternate;
                    animation-iteration-count: 2;
                }
            `}</style>
        </div>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

interface ModalProps {
    notification: Notification | null;
    onClose: () => void;
    getIcon: (type: NotificationType) => React.ReactNode;
    getTypeStyles: (type: NotificationType, read: boolean) => string;
    formatTime: (timestamp: number) => string;
}

function NotificationDetailsModal({ notification, onClose, getIcon, getTypeStyles, formatTime }: ModalProps) {
    if (!notification) return null;

    return (
        <ModalPortal isOpen={!!notification} onClose={onClose}>
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
                {/* Header Backdrop */}
                <div className={`absolute top-0 left-0 right-0 h-32 opacity-10 dark:opacity-20 ${notification.type === 'success' ? 'bg-emerald-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-amber-500' :
                            notification.type === 'info' ? 'bg-primary' : 'bg-primary'
                    }`} />

                <div className="relative p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center border transition-all duration-500 scale-110 shadow-lg ${getTypeStyles(notification.type, false)}`}>
                            {getIcon(notification.type)}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-2xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeStyles(notification.type, false)}`}>
                                {notification.type}
                            </span>
                            <span className="text-xs font-medium text-zinc-400 font-mono">
                                {formatTime(notification.timestamp)}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                            {notification.title}
                        </h2>
                        <div className="bg-zinc-50 dark:bg-white/[0.03] rounded-3xl p-6 border border-zinc-100 dark:border-white/5">
                            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {notification.message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Close
                        </button>
                        {notification.category === "marketing" && (
                            <button className="p-4 bg-primary text-primary-foreground rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                                <ExternalLink className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}

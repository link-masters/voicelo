"use client";

import React, { useEffect } from "react";
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-primary" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    };

    const backgrounds = {
        success: "bg-white dark:bg-zinc-900 border-emerald-500/20 shadow-emerald-500/10",
        error: "bg-white dark:bg-zinc-900 border-red-500/20 shadow-red-500/10",
        info: "bg-white dark:bg-zinc-900 border-primary/20 shadow-primary/10",
        warning: "bg-white dark:bg-zinc-900 border-amber-500/20 shadow-amber-500/10",
    };

    return (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-4 px-4 py-3 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full ${backgrounds[type]}`}>
            <div className="shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
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
                            type === 'info' ? 'bg-primary' : 'bg-amber-500'
                        }`}
                    style={{
                        animation: `toast-progress ${duration}ms linear forwards`
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
}

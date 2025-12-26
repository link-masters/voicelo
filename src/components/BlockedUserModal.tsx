"use client";

import React from "react";
import { X, ShieldAlert, AlertTriangle } from "lucide-react";

interface BlockedUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BlockedUserModal({ isOpen, onClose }: BlockedUserModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl border border-red-500/20 animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header with Icon */}
                <div className="flex flex-col items-center text-center mb-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/10">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Account Blocked</h2>
                        <p className="text-muted-foreground text-sm">
                            Access to your account has been restricted.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                    <p className="text-muted-foreground text-center text-sm leading-relaxed">
                        Your account has been blocked by the administrator. verify your status or restore access, please contact our support team.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => window.location.href = "mailto:support@sonicflow.com"}
                        className="w-full btn bg-foreground text-background hover:opacity-90 py-3.5 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        Contact Support
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full btn bg-transparent border border-border text-muted-foreground hover:bg-secondary hover:text-foreground py-3.5 rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

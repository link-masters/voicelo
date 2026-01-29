"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import ModalPortal from "./ModalPortal";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
    variant = "danger"
}: ConfirmationModalProps) {

    const variantConfig = {
        danger: {
            primaryColor: "bg-[#ef4444] hover:bg-red-600",
            shadowColor: "shadow-red-500/20",
        },
        warning: {
            primaryColor: "bg-amber-500 hover:bg-amber-600",
            shadowColor: "shadow-amber-500/20",
        },
        info: {
            primaryColor: "bg-primary hover:opacity-90",
            shadowColor: "shadow-primary/20",
        }
    };

    const config = variantConfig[variant];

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[1.25rem] shadow-2xl border border-zinc-100 dark:border-white/10 animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Content Area */}
                <div className="p-8 pb-6">
                    <div className="space-y-4 text-left">
                        <h3 className="text-[20px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
                            {title}
                        </h3>
                        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="h-[1px] w-full bg-zinc-100 dark:bg-white/5" />

                {/* Footer/Actions */}
                <div className="p-5 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 text-[15px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`min-w-[130px] px-6 py-3 ${config.primaryColor} text-white rounded-2xl text-[15px] font-bold transition-all shadow-lg ${config.shadowColor} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}

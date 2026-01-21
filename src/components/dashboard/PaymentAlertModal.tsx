"use client";

import React from "react";
import { X, CreditCard, AlertTriangle, ArrowRight, Coins, Mic } from "lucide-react";

export type AlertType = 'billing_ended' | 'insufficient_credits' | 'limit_reached';

interface PaymentAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    type?: AlertType;
}

export default function PaymentAlertModal({
    isOpen,
    onClose,
    onUpgrade,
    type = 'billing_ended'
}: PaymentAlertModalProps) {
    if (!isOpen) return null;

    const content = {
        billing_ended: {
            title: "Billing Cycle Ended",
            description: "Your latest billing cycle has reached its end. To continue generating high-quality AI speech, please purchase a new credit pack.",
            icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
            iconBg: "bg-amber-500/10",
            iconBorder: "border-amber-500/20",
            buttonText: "Purchase Credits",
            buttonIcon: <CreditCard className="w-5 h-5" />
        },
        insufficient_credits: {
            title: "Insufficient Credits",
            description: "You've run out of credits for speech generation. Upgrade your pack now to keep creating amazing voiceovers.",
            icon: <Coins className="w-10 h-10 text-primary" />,
            iconBg: "bg-primary/10",
            iconBorder: "border-primary/20",
            buttonText: "Top Up Credits",
            buttonIcon: <Coins className="w-5 h-5" />
        },
        limit_reached: {
            title: "Clone Limit Reached",
            description: "You've reached your maximum voice clone slots. Delete an existing voice to free up a slot, or upgrade your plan to unlock more capacity.",
            icon: <Mic className="w-10 h-10 text-primary" />,
            iconBg: "bg-primary/10",
            iconBorder: "border-primary/20",
            buttonText: "Upgrade Plan",
            buttonIcon: <CreditCard className="w-5 h-5" />
        }
    }[type];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-10 text-zinc-500"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10 text-center">
                    <div className={`w-20 h-20 rounded-[2rem] ${content.iconBg} flex items-center justify-center mx-auto mb-6 border ${content.iconBorder}`}>
                        {content.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{content.title}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed text-sm md:text-base">
                        {content.description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onUpgrade}
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group"
                        >
                            {content.buttonIcon}
                            {content.buttonText}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-all font-sans text-sm"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
    children: React.ReactNode;
    onClose: () => void;
    isOpen: boolean;
}

/**
 * ModalPortal Wrap
 * Handles portaling to body and responsive sidebar exclusion (lg:left-64)
 */
export default function ModalPortal({ children, onClose, isOpen }: ModalPortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className="fixed top-0 right-0 bottom-0 left-0 lg:left-64 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-default"
                onClick={onClose}
            />

            {/* Modal Content Wrapper - ensures relative positioning for children */}
            <div className="relative w-full flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto w-full flex items-center justify-center">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

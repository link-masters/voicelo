"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Mic, ArrowRight } from "lucide-react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
    const { user, loading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [signInModalOpen, setSignInModalOpen] = useState(false);
    const [signUpModalOpen, setSignUpModalOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const navLinks = [
        { name: "Features", href: "/#features" },
        { name: "Demo", href: "/#demo" },
        { name: "Pricing", href: "/pricing" },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
                    ? "bg-black/80 backdrop-blur-md border-white/10 py-4"
                    : "bg-transparent border-transparent py-6"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                            <Mic className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white">SonicFlow</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Actions */}
                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-24 h-10 rounded-full bg-white/5 animate-pulse" />
                        ) : user ? (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 group"
                                >
                                    Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={() => setSignInModalOpen(true)}
                                className="hidden md:block px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-zinc-400 hover:text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 md:hidden p-6 flex flex-col gap-6 animate-in slide-in-from-top-5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-zinc-400 hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-white/5">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => {
                                        setSignInModalOpen(true);
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Modals */}
            <SignInModal
                isOpen={signInModalOpen}
                onClose={() => setSignInModalOpen(false)}
                onSwitchToSignUp={() => {
                    setSignInModalOpen(false);
                    setSignUpModalOpen(true);
                }}
            />
            <SignUpModal
                isOpen={signUpModalOpen}
                onClose={() => setSignUpModalOpen(false)}
                onSwitchToSignIn={() => {
                    setSignUpModalOpen(false);
                    setSignInModalOpen(true);
                }}
            />
        </>
    );
}

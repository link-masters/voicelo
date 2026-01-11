"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, AudioWaveform, ArrowRight, Sun, Moon, Home, Sparkles, CircleDollarSign, ChevronRight } from "lucide-react";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
    const { user, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [signInModalOpen, setSignInModalOpen] = useState(false);
    const [signUpModalOpen, setSignUpModalOpen] = useState(false);
    const pathname = usePathname();

    const [currentHash, setCurrentHash] = useState("");

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        const handleHashChange = () => {
            setCurrentHash(window.location.hash);
        };

        // Initial checks
        handleScroll();
        handleHashChange();

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("hashchange", handleHashChange);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    // Update hash on pathname change as well (e.g. navigation)
    useEffect(() => {
        setCurrentHash(window.location.hash);
    }, [pathname]);

    const navLinks = [
        { name: "Home", href: "/", icon: Home },
        { name: "Features", href: "/#features", icon: Sparkles },
        { name: "Pricing", href: "/pricing", icon: CircleDollarSign },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
                    ? "bg-background/80 backdrop-blur-md border-border py-4 shadow-sm"
                    : "bg-transparent border-transparent py-6"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                            <AudioWaveform className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-foreground">VoiceLo</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => {
                            let isActive = pathname === link.href;

                            if (link.href === "/#features") {
                                isActive = pathname === "/" && currentHash === "#features";
                            } else if (link.href === "/") {
                                isActive = pathname === "/" && currentHash !== "#features";
                            }

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative text-sm font-medium transition-all py-1.5 px-3 rounded-xl group outline-none flex items-center gap-2 ${isActive ? "text-primary bg-primary/5 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:text-foreground"
                                        }`}
                                    onClick={() => setCurrentHash(link.href.includes('#') ? '#features' : '')}
                                >
                                    <link.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                                    {link.name}
                                    <span className={`absolute -bottom-1 left-3 right-3 h-0.5 bg-primary rounded-full transition-all duration-300 ease-in-out ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        }`} />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Auth Actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-all hover:scale-105"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {loading ? (
                            <div className="w-24 h-10 rounded-full bg-secondary animate-pulse" />
                        ) : user ? (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center gap-2 group shadow-lg shadow-primary/20"
                                >
                                    Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={() => setSignInModalOpen(true)}
                                className="hidden md:block px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border md:hidden p-6 flex flex-col gap-6 animate-in slide-in-from-top-5 shadow-2xl">
                        {navLinks.map((link) => {
                            let isActive = pathname === link.href;

                            if (link.href === "/#features") {
                                isActive = pathname === "/" && currentHash === "#features";
                            } else if (link.href === "/") {
                                isActive = pathname === "/" && currentHash !== "#features";
                            }
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative text-xl font-semibold transition-all w-full flex items-center gap-4 p-4 rounded-2xl group ${isActive ? "text-primary bg-primary/5 border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        }`}
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setCurrentHash(link.href.includes('#') ? '#features' : '');
                                    }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                                        <link.icon className="w-5 h-5" />
                                    </div>
                                    {link.name}
                                    <span className={`ml-auto transition-transform ${isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </span>
                                </Link>
                            );
                        })}
                        <div className="pt-4 border-t border-border">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2"
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
                                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold"
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

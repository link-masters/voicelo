import React from "react";
import Link from "next/link";
import { Heart, Shield, FileText, RefreshCcw, Cookie, Mic, MessageSquare, Mic2, Trophy } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-border bg-secondary/20 backdrop-blur-sm py-12 mt-auto">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
                    {/* Brand & Description */}
                    <div className="md:col-span-2 space-y-4 text-center md:text-left">
                        <div className="flex flex-col items-center md:items-start gap-1">
                            <div className="flex items-center gap-2.5 mb-1 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                                    <Mic className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <span className="text-xl font-bold text-foreground tracking-tight">
                                    VoiceLo
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                The most advanced AI voice synthesis platform for creators and developers. Human-like speech in seconds.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Product</h4>
                        <Link href="/text-to-speech" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Text To Speech
                        </Link>
                        <Link href="/voice-cloning" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <Mic2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Voice Cloning
                        </Link>
                    </div>

                    {/* Earn With Us Section */}
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Earn With Us</h4>
                        <Link href="/dashboard/influencer-program" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <Trophy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Influencer Program
                        </Link>
                    </div>

                    {/* Legal Links */}
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Legal</h4>
                        <Link href="/privacy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Terms of Service
                        </Link>
                        <Link href="/refund" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <RefreshCcw className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Refund Policy
                        </Link>
                        <Link href="/cookies" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <Cookie className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Cookie Policy
                        </Link>
                    </div>

                    {/* Contact Us Section */}
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Contact Us</h4>
                        <a href="mailto:support@voicelo.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-0 w-0 h-0 hidden" />
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 flex items-center justify-center">@</span>
                                support@voicelo.com
                            </span>
                        </a>
                        <a href="https://discord.gg/voicelo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01 10.124 10.124 0 0 0 .372.292.075.075 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discord Server
                        </a>
                        <a href="https://x.com/Voiceloofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                            </svg>
                            Twitter / X
                        </a>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-col items-center justify-center gap-6">
                    {/* Copyright */}
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} VoiceLo. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

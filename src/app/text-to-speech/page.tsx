"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mic, Zap, Globe, Shield, Play } from "lucide-react";
import Link from "next/link";

export default function TextToSpeechPage() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-24 sm:py-32 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                Core Technology
                            </div>
                            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight">
                                Professional <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">Text To Speech</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                Transform your written content into natural-sounding speech instantly. Our V2 Neural Engine delivers humans-like prosody and intonation.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/dashboard" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20">
                                    Try for Free
                                </Link>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative bg-card/50 backdrop-blur-xl border border-border p-8 rounded-3xl space-y-6 shadow-2xl">
                                <div className="space-y-2">
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[70%] animate-pulse" />
                                    </div>
                                    <div className="h-1.5 w-[85%] bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 w-[40%] animate-pulse delay-75" />
                                    </div>
                                    <div className="h-1.5 w-[60%] bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[90%] animate-pulse delay-150" />
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-2xl text-sm italic text-muted-foreground">
                                    "Generation complete. High-fidelity audio ready for export."
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-1 h-8 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                                        ))}
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground">24-bit / 48kHz</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Instant Generation",
                                desc: "No queues or wait times. Get your audio files as fast as your internet connection allows."
                            },
                            {
                                icon: Globe,
                                title: "100+ Languages",
                                desc: "Global reach with native-quality voices across virtually every common dialect."
                            },
                            {
                                icon: Shield,
                                title: "Commercial Rights",
                                desc: "Use your generated audio for YouTube, Podcasts, Ads, and more with full ownership."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

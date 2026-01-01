"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mic2, Users, Lock, Sparkles, Upload, PlayCircle, Zap, Shield, ArrowRight, AudioLines } from "lucide-react";
import Link from "next/link";

export default function VoiceCloningPage() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-15%] left-[5%] w-[40%] h-[40%] bg-gradient-to-tr from-violet-500/10 to-primary/15 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 pt-24 pb-12 sm:pt-32 sm:pb-16 w-full">

                    {/* Hero Section */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
                        <div className="order-2 lg:order-2 relative group">
                            {/* Decorative Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-blue-500/20 to-violet-500/30 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                            <div className="relative bg-card/60 dark:bg-black/40 backdrop-blur-2xl border border-border/50 dark:border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="h-2 w-32 bg-secondary rounded-full mb-2" />
                                            <div className="h-2 w-24 bg-secondary/50 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                                        Processing
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-white/5 border border-border/50 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
                                            <Upload className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">Analyzing Voice Spectrum</div>
                                            <div className="text-xs text-muted-foreground">Extracting biometric nuances...</div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-4 opacity-75">
                                        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">Cloning Successful</div>
                                            <div className="text-xs text-muted-foreground">Voice model ready for synthesis.</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-border/50 flex justify-center">
                                    <div className="flex items-center gap-1.5 h-12">
                                        {Array.from({ length: 20 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-primary/40 rounded-full animate-wave"
                                                style={{
                                                    height: `${Math.random() * 60 + 20}%`,
                                                    animationDelay: `${i * 0.05}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                <Zap className="w-4 h-4" />
                                High-Fidelity Cloning
                            </div>

                            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
                                Your Voice, <br />
                                <span className="text-primary">Perfectly Cloned.</span>
                            </h1>

                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                Create an identical digital copy of any voice in 15 languages with our breakthrough neural rendering technology.
                                Secure, private, and breathtakingly realistic.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/dashboard"
                                    className="group px-8 py-4 rounded-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-bold text-lg hover:opacity-95 transition-all shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] flex items-center justify-center gap-3"
                                >
                                    Start Cloning Now
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <section className="mb-32">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Zap,
                                    title: "Instant (zero-shot) cloning",
                                    desc: "Our advanced models can replicate any voice instantly without any prior training on that specific speaker.",
                                    color: "text-amber-500",
                                    bg: "bg-amber-500/10"
                                },
                                {
                                    icon: Mic2,
                                    title: "Ultra-Short Samples",
                                    desc: "Creates a custom voice from just 5-15 seconds of audio. No need for long recording sessions.",
                                    color: "text-blue-500",
                                    bg: "bg-blue-500/10"
                                },
                                {
                                    icon: Shield,
                                    title: "Encrypted & Secure",
                                    desc: "Your voice data is encrypted and used only for your content. We prioritize your biometric privacy.",
                                    color: "text-emerald-500",
                                    bg: "bg-emerald-500/10"
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-card/60 dark:bg-black/30 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Comparison/Detail Section */}
                    <div className="relative mb-8 p-12 sm:p-16 rounded-[2.5rem] bg-card/40 dark:bg-black/40 backdrop-blur-2xl border border-border/50 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

                        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 text-left">
                                <h2 className="text-4xl font-bold leading-tight">
                                    Revolutionary <br />
                                    <span className="text-primary font-black">Neural Architecture</span>
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    We use proprietary zero-shot learning techniques that understand the fundamental components of human speech, allowing for instant replication from minimal data.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Captures unique timbre and resonance",
                                        "Matches underlying emotional tone",
                                        "Support for 15 major languages",
                                        "Studio-grade 44.1kHz audio output"
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <span className="text-foreground font-medium">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="relative">
                                <div className="p-8 rounded-3xl bg-secondary/50 dark:bg-white/5 border border-border/50">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-background">
                                            <PlayCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[75%] animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono text-muted-foreground bg-black/10 dark:bg-black/40 p-4 rounded-xl border border-border/30">
                                        {`// Sample Verification Score`} <br />
                                        <span className="text-green-500">{`Similarity Index: 0.992`}</span> <br />
                                        <span className="text-blue-500">{`Timbre Match: 98.4%`}</span> <br />
                                        <span className="text-violet-500">{`Latency: 124ms`}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>

            <style jsx>{`
                @keyframes wave {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.4); }
                }
                .animate-wave {
                    animation: wave 1s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

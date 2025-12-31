"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mic2, Users, Lock, Sparkles, Upload, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function VoiceCloningPage() {
    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[30%] h-[30%] bg-slate-50 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-24 sm:py-32 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative bg-card/50 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-2 w-32 bg-secondary rounded-full" />
                                        <div className="h-2 w-24 bg-secondary/50 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                                            <Upload className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                        <div className="text-sm font-medium">Analyzing voice patterns...</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="text-sm font-medium">Cloning successful.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                Advanced AI
                            </div>
                            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight">
                                Your Voice, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Duplicated.</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                Clone any voice with just 30 seconds of sample audio. Perfect for brands, narrators, and personalized automated content.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/dashboard" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20">
                                    Clone Your Voice
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8 text-center sm:text-left">
                        {[
                            {
                                icon: Mic2,
                                title: "High Fidelity",
                                desc: "Proprietary neural architecture that captures unique timbre, pitch, and emotional nuances."
                            },
                            {
                                icon: Lock,
                                title: "Private & Secure",
                                desc: "Your voice data is encrypted and only accessible by you. We never share your biometric data."
                            },
                            {
                                icon: PlayCircle,
                                title: "Zero Latency",
                                desc: "Once cloned, generate hours of content in your own voice instantly."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto sm:mx-0">
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

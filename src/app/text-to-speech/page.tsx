"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    Mic2,
    Volume2,
    Languages,
    Zap,
    Download,
    Play,
    Pause,
    Sparkles,
    AudioLines,
    FileAudio,
    Clock,
    Users,
    ArrowRight
} from "lucide-react";

export default function TextToSpeechPage() {



    const features = [
        {
            icon: Volume2,
            title: "Crystal Clear Audio",
            desc: "Industry-leading voice synthesis with natural intonation, emotion, and crystal-clear pronunciation.",
            gradient: "from-violet-500 to-purple-600"
        },
        {
            icon: Languages,
            title: "50+ Languages",
            desc: "Native-sounding voices across 50+ languages and 200+ regional dialects and accents.",
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: Zap,
            title: "Instant Generation",
            desc: "Real-time text-to-speech conversion in milliseconds. No waiting, no queues.",
            gradient: "from-amber-500 to-orange-500"
        },
        {
            icon: Download,
            title: "Export Anywhere",
            desc: "Download as MP3, WAV, or stream directly. Perfect for podcasts, videos, and apps.",
            gradient: "from-emerald-500 to-green-500"
        }
    ];

    const useCases = [
        {
            icon: FileAudio,
            title: "Content Creation",
            desc: "Transform blog posts, scripts, and articles into engaging audio content."
        },
        {
            icon: Users,
            title: "Accessibility",
            desc: "Make your content accessible to visually impaired users worldwide."
        },
        {
            icon: Clock,
            title: "Productivity",
            desc: "Listen to documents and emails while multitasking on other work."
        }
    ];

    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-violet-500/10 to-primary/15 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-24 sm:py-32 w-full">

                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center mb-32">
                        {/* Left: Content */}
                        <div className="space-y-8 max-w-3xl">

                            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
                                <span className="text-foreground">Transform Text</span>
                                <br />
                                <span className="text-primary">
                                    Into Speech.
                                </span>
                            </h1>

                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                Convert any text into lifelike, natural-sounding speech instantly.
                                Perfect for creators, educators, and businesses seeking premium voice solutions.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/dashboard"
                                    className="group px-8 py-4 rounded-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-bold text-lg hover:opacity-95 transition-all shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] flex items-center justify-center gap-3"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Try It Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 pt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span><strong className="text-foreground">200+</strong> voices</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <section className="mb-32">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                Why Choose{" "}
                                <span className="text-primary">
                                    VoiceLo TTS?
                                </span>
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Industry-leading text-to-speech technology designed for creators who demand excellence.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, i) => (
                                <div
                                    key={i}
                                    className="group p-8 rounded-3xl bg-card/50 dark:bg-black/30 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="mb-32">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                How It{" "}
                                <span className="text-primary">
                                    Works
                                </span>
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Three simple steps to transform your text into professional audio.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    step: "01",
                                    title: "Enter Your Text",
                                    desc: "Paste or type up to 10,000 characters. Support for SSML tags for advanced control.",
                                    icon: Mic2
                                },
                                {
                                    step: "02",
                                    title: "Choose a Voice",
                                    desc: "Select from 200+ premium voices across 50+ languages. Preview before you generate.",
                                    icon: Users
                                },
                                {
                                    step: "03",
                                    title: "Generate & Download",
                                    desc: "Click generate and download your audio in seconds. MP3, WAV, and more formats available.",
                                    icon: Download
                                }
                            ].map((item, i) => (
                                <div key={i} className="relative">
                                    {/* Connection Line */}
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                                    )}

                                    <div className="relative p-8 rounded-3xl bg-gradient-to-br from-secondary/30 to-secondary/10 dark:from-white/5 dark:to-white/[0.02] border border-border/50 hover:border-primary/20 transition-all">
                                        <div className="absolute -top-4 -left-2 text-7xl font-black text-primary/10 dark:text-primary/20">
                                            {item.step}
                                        </div>
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-6">
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Use Cases Section */}
                    <section className="mb-32">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                                    Built for{" "}
                                    <span className="text-primary">
                                        Every Use Case
                                    </span>
                                </h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    From content creators to enterprise applications, VoiceLo powers millions of audio experiences worldwide.
                                </p>

                                <div className="space-y-4">
                                    {useCases.map((useCase, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-4 p-5 rounded-2xl bg-secondary/20 dark:bg-white/5 border border-border/50 hover:border-primary/20 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                                <useCase.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-1">{useCase.title}</h4>
                                                <p className="text-muted-foreground">{useCase.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-[2rem] blur-2xl opacity-40" />
                                <div className="relative grid grid-cols-2 gap-4">
                                    {[
                                        { value: "10M+", label: "Audio Files Generated", color: "text-primary" },
                                        { value: "200+", label: "Premium Voices", color: "text-violet-500" },
                                        { value: "50+", label: "Languages Supported", color: "text-emerald-500" },
                                        { value: "99.9%", label: "Uptime Guarantee", color: "text-amber-500" }
                                    ].map((stat, i) => (
                                        <div
                                            key={i}
                                            className="p-6 rounded-2xl bg-card/60 dark:bg-black/40 backdrop-blur-xl border border-border/50 text-center hover:border-primary/20 transition-all hover:scale-[1.02]"
                                        >
                                            <div className={`text-4xl font-black mb-2 ${stat.color}`}>
                                                {stat.value}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-violet-500/10 rounded-[3rem] blur-xl" />
                        <div className="relative p-12 sm:p-16 rounded-[2.5rem] bg-card/50 dark:bg-black/40 backdrop-blur-2xl border border-border/50 text-center overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />

                            <div className="relative z-10 space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                                    <Sparkles className="w-4 h-4" />
                                    Start Free Today
                                </div>

                                <h2 className="text-4xl sm:text-5xl font-bold">
                                    Ready to Give Your Text{" "}
                                    <span className="text-primary">
                                        a Voice?
                                    </span>
                                </h2>

                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                    Join thousands of creators, developers, and businesses who trust VoiceLo for their text-to-speech needs.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <Link
                                        href="/dashboard"
                                        className="group px-10 py-5 rounded-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-bold text-lg hover:opacity-95 transition-all shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] flex items-center gap-3"
                                    >
                                        Get Started Free
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        className="px-10 py-5 rounded-full bg-secondary/50 hover:bg-secondary border border-border text-foreground font-semibold transition-all hover:scale-[1.02]"
                                    >
                                        See Pricing
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>

            {/* Custom Animation Styles */}
            <style jsx>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress {
                    animation: progress 12s linear infinite;
                }
            `}</style>
        </div>
    );
}

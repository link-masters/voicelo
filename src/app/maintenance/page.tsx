"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hammer, Timer, Mail, Globe, Settings } from "lucide-react";

export default function MaintenancePage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#030303] flex items-center justify-center p-4">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -40, 0],
                        y: [0, 60, 0],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px]"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
            </div>

            <div className="max-w-3xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center"
                >
                    {/* Logo/Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                            />
                            <div className="relative bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl">
                                <Settings className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        Refining <span className="text-primary italic">Excellence</span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
                        We're currently performing scheduled maintenance to enhance your experience.
                        Our digital artisans are working tirelessly to bring you something better.
                    </p>

                    {/* Progress Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        {[
                            { icon: Timer, label: "Est. Time", value: "≈ 45 mins" },
                            { icon: Globe, label: "Status", value: "Updating" },
                            { icon: Hammer, label: "Developer", value: "Antigravity" },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="bg-white/[0.03] backdrop-blur-sm border border-white/5 p-4 rounded-xl flex flex-col items-center gap-2"
                            >
                                <item.icon className="w-5 h-5 text-primary/70" />
                                <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium">{item.label}</span>
                                <span className="text-zinc-200 font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Call to Action / Social */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Notify Me
                        </button>
                        <a
                            href="/"
                            className="px-8 py-3 bg-white/5 text-white border border-white/10 font-semibold rounded-full hover:bg-white/10 transition-colors"
                        >
                            Learn More
                        </a>
                    </div>

                    <div className="mt-16 pt-8 border-t border-white/5">
                        <p className="text-sm text-zinc-500">
                            &copy; {new Date().getFullYear()} VoiceLo. All rights reserved.
                            <br />
                            Follow us on <span className="text-primary cursor-pointer hover:underline">Twitter</span> for updates.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Decorative lines */}
            <div className="absolute top-0 left-1/2 -ms-px w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
            <div className="absolute top-1/2 left-0 -mt-px w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
        </div>
    );
}

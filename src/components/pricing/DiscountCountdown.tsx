"use client";

import React, { useState, useEffect } from 'react';
import { Timer, Zap, Clock, Percent, Tag } from 'lucide-react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface DiscountCountdownProps {
    expiryDate: string;
    discountCode: string;
    percentage?: number;
    discountName?: string;
}

export default function DiscountCountdown({ expiryDate, discountCode, percentage, discountName }: DiscountCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(expiryDate) - +new Date();
            let timeLeft: TimeLeft | null = null;

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }

            return timeLeft;
        };

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (!remaining) {
                clearInterval(timer);
            }
        }, 1000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [expiryDate]);

    if (!timeLeft) return null;

    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <div className="flex flex-col items-center min-w-[3rem]">
            <div className="flex items-baseline gap-0.5">
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tighter tabular-nums">
                    {value.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {label[0]}
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in-up mt-8">
            <div className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-8 px-6 md:px-10 py-5 rounded-[2.5rem] bg-card/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/5">
                {/* Status Indicator */}
                <div className="flex items-center gap-4 md:pr-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary blur-md opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1.5">Ends Soon</span>
                        <span className="text-base font-bold text-foreground whitespace-nowrap">{discountName || "Special Offer"}</span>
                    </div>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-2 md:gap-4 md:px-8 md:border-x border-primary/20">
                    {timeLeft.days > 0 && (
                        <>
                            <TimeUnit value={timeLeft.days} label="Days" />
                            <span className="w-4 text-center text-2xl font-light text-border/60 pb-2">:</span>
                        </>
                    )}
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <span className="w-4 text-center text-2xl font-light text-border/60 pb-2">:</span>
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <span className="w-4 text-center text-2xl font-light text-border/60 pb-2">:</span>
                    <TimeUnit value={timeLeft.seconds} label="Seconds" />
                </div>

                {/* Badge */}
                <div className="hidden lg:flex items-center pl-8">
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Tag className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-wider">
                            {percentage ? `${percentage}% OFF` : `${discountCode} Active`}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}

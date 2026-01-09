"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, MessageSquare, Sparkles, RefreshCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type QueryType = "General Query" | "Feature Request" | "Refund Request";

interface FormData {
    name: string;
    email: string;
    queryType: QueryType;
    description: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    queryType?: string;
    description?: string;
}

export default function ContactPage() {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        queryType: "General Query",
        description: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
    const [submitMessage, setSubmitMessage] = useState("");

    const queryTypeOptions: { value: QueryType; label: string; icon: React.ReactNode }[] = [
        { value: "General Query", label: "General Query", icon: <MessageSquare className="w-4 h-4" /> },
        { value: "Feature Request", label: "Feature Request", icon: <Sparkles className="w-4 h-4" /> },
        { value: "Refund Request", label: "Refund Request", icon: <RefreshCcw className="w-4 h-4" /> },
    ];

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.queryType) {
            newErrors.queryType = "Please select a query type";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        } else if (formData.description.length > 1000) {
            newErrors.description = "Description must not exceed 1000 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitStatus("idle");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus("success");
                setSubmitMessage(data.message || "Your message has been sent successfully!");
                setFormData({
                    name: "",
                    email: "",
                    queryType: "General Query",
                    description: "",
                });
            } else {
                setSubmitStatus("error");
                setSubmitMessage(data.error || "Something went wrong. Please try again.");
            }
        } catch (error) {
            setSubmitStatus("error");
            setSubmitMessage("Network error. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] right-[-5%] w-[25%] h-[25%] bg-slate-50 dark:bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
                    <div className="space-y-12">
                        {/* Header Section */}
                        <header className="space-y-4 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                                <MessageSquare className="w-4 h-4" />
                                <span>Get in Touch</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                                Contact Us
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Have a question, feature request, or need support? We're here to help.
                                Fill out the form below and we'll get back to you as soon as possible.
                            </p>
                        </header>

                        {/* Contact Form Card */}
                        <div className="relative">
                            {/* Glow effect behind card */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-3xl opacity-30 -z-10" />

                            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
                                {/* Success/Error Message */}
                                {submitStatus !== "idle" && (
                                    <div
                                        className={`mb-8 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${submitStatus === "success"
                                                ? "bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400"
                                                : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {submitStatus === "success" ? (
                                            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {submitStatus === "success" ? "Message Sent!" : "Something went wrong"}
                                            </p>
                                            <p className="text-sm opacity-90 mt-1">{submitMessage}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-foreground">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className={`w-full px-4 py-3.5 bg-secondary/50 border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 ${errors.name ? "border-red-500/50 focus:ring-red-500/50" : "border-border/50"
                                                }`}
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="you@example.com"
                                            className={`w-full px-4 py-3.5 bg-secondary/50 border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 ${errors.email ? "border-red-500/50 focus:ring-red-500/50" : "border-border/50"
                                                }`}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Query Type Dropdown */}
                                    <div className="space-y-2">
                                        <label htmlFor="queryType" className="block text-sm font-medium text-foreground">
                                            Query Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="queryType"
                                                name="queryType"
                                                value={formData.queryType}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3.5 bg-secondary/50 border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 cursor-pointer ${errors.queryType ? "border-red-500/50 focus:ring-red-500/50" : "border-border/50"
                                                    }`}
                                            >
                                                {queryTypeOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.queryType && (
                                            <p className="text-red-500 text-sm flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {errors.queryType}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description Textarea */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="description" className="block text-sm font-medium text-foreground">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <span className={`text-xs ${formData.description.length > 1000 ? "text-red-500" : "text-muted-foreground"}`}>
                                                {formData.description.length}/1000
                                            </span>
                                        </div>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={6}
                                            placeholder="Please describe your query in detail..."
                                            className={`w-full px-4 py-3.5 bg-secondary/50 border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none ${errors.description ? "border-red-500/50 focus:ring-red-500/50" : "border-border/50"
                                                }`}
                                        />
                                        {errors.description && (
                                            <p className="text-red-500 text-sm flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full group relative overflow-hidden px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                    Send Message
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </button>
                                </form>

                                {/* Additional Info */}
                                <div className="mt-8 pt-8 border-t border-border/50">
                                    <p className="text-center text-sm text-muted-foreground">
                                        By submitting this form, you agree to our{" "}
                                        <a href="/privacy" className="text-primary hover:underline">
                                            Privacy Policy
                                        </a>
                                        . We typically respond within 24-48 hours.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center group hover:bg-secondary/50 transition-colors">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">General Inquiries</h3>
                                <p className="text-sm text-muted-foreground">
                                    Questions about our service or need help getting started.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center group hover:bg-secondary/50 transition-colors">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="font-semibold mb-2">Feature Requests</h3>
                                <p className="text-sm text-muted-foreground">
                                    Share your ideas to help us improve Voicelo.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center group hover:bg-secondary/50 transition-colors">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <RefreshCcw className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="font-semibold mb-2">Refund Requests</h3>
                                <p className="text-sm text-muted-foreground">
                                    Need a refund? We'll review your request promptly.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mic, Zap, Globe, Shield, ArrowRight, Play, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import BlockedUserModal from "@/components/BlockedUserModal";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function AuthErrorWatcher({ setIsBlockedModalOpen }: { setIsBlockedModalOpen: (val: boolean) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      try {
        const errorObj = JSON.parse(error);
        if (errorObj?.type === "user_blocked") {
          setIsBlockedModalOpen(true);
          // Optional: Clear the error from URL without refreshing
          router.replace("/", { scroll: false });
        }
      } catch (e) {
        console.error("Error parsing auth error params:", e);
      }
    }
  }, [searchParams, router, setIsBlockedModalOpen]);

  return null;
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
      <Suspense fallback={null}>
        <AuthErrorWatcher setIsBlockedModalOpen={setIsBlockedModalOpen} />
      </Suspense>

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-zinc-50 dark:bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-slate-50 dark:bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Dedicated Header */}
        <Header />

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-32 text-center max-w-5xl mx-auto space-y-8">

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-foreground leading-tight animate-fade-in-up">
            Voice Synthesis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">Reimagined</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Create lifelike speech from text in seconds. The most advanced in-browser text-to-speech engine for creators, developers, and visionaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 animate-fade-in-up delay-200">
            {user ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Generating
              </Link>
            ) : (
              <button
                onClick={() => setIsSignInOpen(true)}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Generating Free
              </button>
            )}

            <button className="px-8 py-4 rounded-full bg-transparent border border-border text-foreground font-medium text-lg hover:bg-secondary/50 transition-colors">
              View Documentation
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-secondary/20 dark:bg-zinc-900/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Real-time generation directly in your browser using optimized WebSpeech API and neural fallbacks."
                },
                {
                  icon: Globe,
                  title: "Multilingual Support",
                  desc: "Access hundreds of voices across dozens of languages and dialects instantly."
                },
                {
                  icon: Shield,
                  title: "Privacy First",
                  desc: "Your data stays on your device. Zero server latency, maximum security."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-card/50 dark:bg-black/40 border border-border hover:border-primary/30 transition-colors group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to give your text <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">a human voice?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose the credit pack that fits your needs. No subscriptions, no hidden fees. Just high-quality AI voices at your fingertips.
            </p>
            <div className="pt-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-primary/20"
              >
                View Pricing Plans
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

      </div>

      {/* Hero section modals */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSwitchToSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
      />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />
      <BlockedUserModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
      />
    </div>
  );
}

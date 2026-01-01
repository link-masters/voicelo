"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { Mic, Zap, Globe, Shield, ArrowRight, Play, Loader2, AudioLines, Pause, ChevronRight, ChevronLeft } from "lucide-react";
import { synthesizeInworldSpeech } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import BlockedUserModal from "@/components/BlockedUserModal";
import { useSearchParams, useRouter } from "next/navigation";

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeWave, setActiveWave] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const scrollPrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const languages = [
    { name: "English", code: "us", male: "Alex", female: "Ashley", sample: "Welcome to VoiceLo, the future of text-to-speech technology. Experience natural, expressive voices that bring your content to life." },
    { name: "Chinese", code: "cn", male: "Yichen", female: "Xiaoyin", sample: "欢迎来到 VoiceLo，语音合成技术的未来。体验生动自然的语音，让您的内容焕发活力。" },
    { name: "Japanese", code: "jp", male: "Satoshi", female: "Asuka", sample: "VoiceLoへようこそ、音声合成技術の未来へ。あなたのコンテンツに命を吹き込む、自然で表現力豊かな声を体験してください。" },
    { name: "Korean", code: "kr", male: "Seojun", female: "Minji", sample: "VoiceLo에 오신 것을 환영합니다. 음성 합성 기술의 미래입니다. 콘텐츠에 생기를 불어넣는 자연스럽고 표현력 있는 목소리를 경험해 보세요." },
    { name: "Russian", code: "ru", male: "Nikolai", female: "Elena", sample: "Добро пожаловать в VoiceLo — будущее технологий синтеза речи. Откройте для себя естественные, выразительные голоса." },
    { name: "Italian", code: "it", male: "Gianni", female: "Orietta", sample: "Benvenuti in VoiceLo, il futuro della tecnologia di sintesi vocale. Sperimenta voci naturali ed espressive." },
    { name: "Spanish", code: "es", male: "Rafael", female: "Lupita", sample: "Bienvenido a VoiceLo, el futuro de la tecnología de texto a voz. Experimenta voces naturales y expresivas." },
    { name: "Portuguese", code: "pt", male: "Heitor", female: "Maitê", sample: "Bem-vindo ao VoiceLo, o futuro da tecnologia de síntesi de voz. Experimente vozes naturais e expressivas." },
    { name: "German", code: "de", male: "Josef", female: "Johanna", sample: "Willkommen bei VoiceLo, der Zukunft der Text-zu-Sprache-Technologie. Erleben Sie natürliche, ausdrucksstarke Stimmen." },
    { name: "French", code: "fr", male: "Alain", female: "Hélène", sample: "Bienvenue sur VoiceLo, l'avenir de la technologie de synthèse vocale. Découvrez des voix naturelles et expressives." },
    { name: "Arabic", code: "sa", male: "Hades", female: "Hana", sample: "مرحبًا بك في VoiceLo، مستقبل تقنية تحويل النص إلى كلام. اختبر أصواتًا طبيعية ومعبرة تضفي الحيوية على محتواك." },
    { name: "Hindi", code: "in", male: "Ronald", female: "Priya", sample: "VoiceLo में आपका स्वागत है, टेक्स्ट-टू-वीच तकनीक का भविष्य। प्राकृतिक, अभिव्यंजक आवाजों का अनुभव करें।" },
    { name: "Hebrew", code: "il", male: "Shaun", female: "Luna", sample: "ברוכים הבאים ל-VoiceLo, העתיד של טכנולוגיית המרת טקסט לדיבור. חוו קולות טבעיים ומלאי הבעה." },
    { name: "Polish", code: "pl", male: "Wojciech", female: "Julia", sample: "Witamy w VoiceLo, przyszłości technologii syntezy mowy. Poznaj naturalne, ekspresyjne głosy." },
    { name: "Dutch", code: "nl", male: "Lennart", female: "Katrien", sample: "Welkom bij VoiceLo, de toekomst van tekst-naar-spraaktechnologie. Ervaar natuurlijke, expressieve stemmen." }
  ];

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate sound waves
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveWave((prev) => (prev + 1) % 5);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
      <Suspense fallback={null}>
        <AuthErrorWatcher setIsBlockedModalOpen={setIsBlockedModalOpen} />
      </Suspense>

      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

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
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-32 text-center max-w-6xl mx-auto space-y-8">

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-foreground leading-tight animate-fade-in-up">
            Voice Synthesis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">Reimagined</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Create lifelike speech from text in seconds. The most advanced in-browser text-to-speech engine for creators, developers, and visionaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 animate-fade-in-up delay-200">
            {user ? (
              <Link
                href="/dashboard"
                className="px-7 py-3 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Generating
              </Link>
            ) : (
              <button
                onClick={() => setIsSignInOpen(true)}
                className="px-7 py-3 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Generating Free
              </button>
            )}
          </div>

          {/* New Voice Preview Section */}
          <div className="w-full max-w-6xl pt-4 animate-fade-in-up delay-300">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-blue-500/20 to-violet-500/30 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

              {/* Card */}
              <div className="relative bg-card/60 dark:bg-black/40 backdrop-blur-2xl border border-border/50 dark:border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden text-left">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                      <AudioLines className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Interactive Voice Preview</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">{selectedLang} Synthesis</p>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
                          <button
                            onClick={() => {
                              setSelectedGender('MALE');
                              setIsPlaying(false);
                              setAudioUrl(null);
                            }}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'MALE' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            Male
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGender('FEMALE');
                              setIsPlaying(false);
                              setAudioUrl(null);
                            }}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'FEMALE' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            Female
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                    • Live Demo
                  </div>
                </div>

                {/* Language Selector */}
                <div className="relative mb-10">
                  <div
                    ref={scrollRef}
                    className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mask-fade-both px-12"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.name}
                        onClick={() => {
                          setSelectedLang(lang.name);
                          setIsPlaying(false);
                          setAudioUrl(null);
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                        }}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap ${selectedLang === lang.name
                          ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/30 scale-105 z-10'
                          : 'bg-secondary/40 border-border/50 text-muted-foreground hover:border-primary/40 hover:bg-secondary/60'
                          }`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                          <img
                            src={`https://flagcdn.com/w80/${lang.code}.png`}
                            alt={lang.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{lang.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Scroll Previous Button */}
                  <div className="absolute left-0 inset-y-0 flex items-center pb-4">
                    <button
                      onClick={scrollPrev}
                      className="w-12 h-12 rounded-full bg-card/90 dark:bg-black/80 backdrop-blur-md border border-border flex items-center justify-center shadow-2xl text-primary hover:scale-110 active:scale-95 transition-all z-20 group/btn"
                      aria-label="Previous Languages"
                    >
                      <ChevronLeft className="w-6 h-6 group-hover/btn:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Scroll Next Button */}
                  <div className="absolute right-0 inset-y-0 flex items-center pb-4">
                    <button
                      onClick={scrollNext}
                      className="w-12 h-12 rounded-full bg-card/90 dark:bg-black/80 backdrop-blur-md border border-border flex items-center justify-center shadow-2xl text-primary hover:scale-110 active:scale-95 transition-all z-20 group/btn"
                      aria-label="Next Languages"
                    >
                      <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Text Area Simulation */}
                <div className="p-5 rounded-2xl bg-secondary/30 dark:bg-white/5 border border-border/50 mb-6 min-h-[100px] flex items-center">
                  <p className="text-foreground leading-relaxed text-lg italic">
                    "{languages.find(l => l.name === selectedLang)?.sample}"
                  </p>
                </div>

                {/* Waveform Visualization */}
                <div className="flex items-center justify-center gap-1.5 h-20 mb-6 px-4">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const staticHeight = 30;
                    const dynamicHeight = mounted
                      ? (isPlaying
                        ? Math.sin((i + activeWave) * 0.5) * 30 + 40
                        : Math.sin(i * 0.3) * 20 + 30)
                      : staticHeight;

                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-200 ${isPlaying ? 'bg-gradient-to-t from-primary to-blue-400' : 'bg-border dark:bg-white/20'}`}
                        style={{
                          height: `${dynamicHeight}%`,
                          opacity: isPlaying ? 1 : 0.5
                        }}
                      />
                    );
                  })}
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={async () => {
                      if (isPlaying) {
                        audioRef.current?.pause();
                        return;
                      }

                      if (audioUrl) {
                        audioRef.current?.play();
                        return;
                      }

                      try {
                        setIsGenerating(true);
                        const langData = languages.find(l => l.name === selectedLang);
                        if (!langData) return;

                        const voiceId = selectedGender === 'MALE' ? langData.male : langData.female;

                        const result = await synthesizeInworldSpeech(
                          langData.sample,
                          voiceId,
                          "anonymous", // userId
                          { isPreview: true }
                        );

                        if (result.audioContent) {
                          const binaryString = window.atob(result.audioContent);
                          const bytes = new Uint8Array(binaryString.length);
                          for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                          }
                          const blob = new Blob([bytes], { type: 'audio/mp3' });
                          const url = URL.createObjectURL(blob);
                          setAudioUrl(url);

                          // Auto play after small delay to ensure ref is ready
                          setTimeout(() => {
                            audioRef.current?.play().catch(console.error);
                          }, 100);
                        }
                      } catch (err) {
                        console.error("Home synthesis error:", err);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl ${isPlaying
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                      : isGenerating
                        ? 'bg-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-primary/30'
                      }`}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6 text-white fill-current" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{Math.floor(currentTime)}s</span>
                      <span className="text-muted-foreground">{Math.floor(duration)}s</span>
                    </div>
                    <div className="h-2 bg-secondary dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all`}
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 12s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-fade-both {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
}

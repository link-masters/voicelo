"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { Mic, Zap, Globe, Shield, ArrowRight, Play, Loader2, AudioLines, Pause, ChevronRight, ChevronLeft, Sparkles, Users, Clock, Award, Download, Headphones, Video, BookOpen, Building2, Mic2, CheckCircle2, Star, Languages, Wand2, Megaphone } from "lucide-react";
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
    { name: "English", code: "us", male: "Alex", female: "Ashley", sample: "VoiceLo delivers professional, expressive voices for modern content." },
    { name: "Chinese", code: "cn", male: "Yichen", female: "Xiaoyin", sample: "VoiceLo 为现代内容提供专业、富有表现力的语音。" },
    { name: "Japanese", code: "jp", male: "Satoshi", female: "Asuka", sample: "VoiceLoは、現代のコンテンツにプロフェッショナルで表現力豊かな音声を提供します。" },
    { name: "Korean", code: "kr", male: "Seojun", female: "Minji", sample: "VoiceLo는 현대 콘텐츠를 위한 전문적이고 표현력 있는 음성을 제공합니다." },
    { name: "Russian", code: "ru", male: "Nikolai", female: "Elena", sample: "VoiceLo предоставляет профессиональные, выразительные голоса для современного контента." },
    { name: "Italian", code: "it", male: "Gianni", female: "Orietta", sample: "VoiceLo offre voci professionali ed espressive per contenuti moderni." },
    { name: "Spanish", code: "es", male: "Rafael", female: "Lupita", sample: "VoiceLo ofrece voces profesionales y expresivas para contenido moderno." },
    { name: "Portuguese", code: "pt", male: "Heitor", female: "Maitê", sample: "VoiceLo oferece vozes profissionais e expressivas para conteúdo moderno." },
    { name: "German", code: "de", male: "Josef", female: "Johanna", sample: "VoiceLo liefert professionelle, ausdrucksstarke Stimmen für moderne Inhalte." },
    { name: "French", code: "fr", male: "Alain", female: "Hélène", sample: "VoiceLo propose des voix professionnelles et expressives pour du contenu moderne." },
    { name: "Arabic", code: "sa", male: "Hades", female: "Hana", sample: "يقدم VoiceLo أصواتًا احترافية ومعبرة للمحتوى الحديث." },
    { name: "Hindi", code: "in", male: "Ronald", female: "Priya", sample: "VoiceLo आधुनिक सामग्री के लिए पेशेवर, अभिव्यंजक आवाज़ें प्रदान करता है।" },
    { name: "Hebrew", code: "il", male: "Shaun", female: "Luna", sample: "VoiceLo מספק קולות מקצועיים ואקספרסיביים לתוכן מודרני." },
    { name: "Polish", code: "pl", male: "Wojciech", female: "Julia", sample: "VoiceLo dostarcza profesjonalne, ekspresyjne głosy dla nowoczesnych treści." },
    { name: "Dutch", code: "nl", male: "Lennart", female: "Katrien", sample: "VoiceLo levert professionele, expressieve stemmen voor moderne content." }
  ];

  const useCases = [
    { icon: Video, title: "Content Creators", desc: "YouTube videos, podcasts, and social media content" },
    { icon: BookOpen, title: "E-Learning", desc: "Educational courses, tutorials, and training materials" },
    { icon: Megaphone, title: "Marketing", desc: "Ads, promotional videos, and brand voice content" },
    { icon: Headphones, title: "Audiobooks", desc: "Convert written content into engaging audio format" },
  ];

  const stats = [
    { value: "15+", label: "Languages Supported" },
    { value: "50+", label: "Premium Voices" },
    { value: "Instant", label: "Generation" },
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
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center max-w-6xl mx-auto space-y-8">


          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-tight animate-fade-in-up">
            Text to Speech <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">AI Voice Generator</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Transform your text into studio-quality, professional speech in no time. Perfect for content creators, educators, and businesses worldwide where voice quality is first priority.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 animate-fade-in-up delay-200">
            {user ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setIsSignUpOpen(true)}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Get Free 1000 Credits
              </button>
            )}
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-full bg-secondary/50 hover:bg-secondary text-foreground font-bold text-base transition-all border border-border flex items-center gap-2"
            >
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 animate-fade-in-up delay-300">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Voice Preview Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Try It Now</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Experience the quality of our AI voices instantly. Select a language and click play.</p>
            </div>

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
                      <h3 className="font-bold text-lg">Preview Voice</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">{selectedLang}</p>
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
                <div className="p-5 rounded-2xl bg-secondary/30 dark:bg-white/5 border border-border/50 mb-6 min-h-[100px] flex items-center justify-center">
                  <p className="text-foreground leading-relaxed text-lg italic text-center">
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

        {/* How It Works Section */}
        <section className="py-24 bg-secondary/10 dark:bg-zinc-900/20 border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                How It Works
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Generate Voice in 3 Simple Steps</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">From text to professional speech in seconds. No technical knowledge required.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Enter Your Text",
                  desc: "Paste or type the text you want to convert. Supports paragraphs, scripts, or even entire documents.",
                  icon: BookOpen
                },
                {
                  step: "02",
                  title: "Choose a Voice",
                  desc: "Select from 50+ premium AI voices across 15+ languages.",
                  icon: Mic2
                },
                {
                  step: "03",
                  title: "Generate & Download",
                  desc: "Click generate and download your high-quality MP3 audio file instantly. It's that simple.",
                  icon: Download
                }
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-card/50 dark:bg-black/40 border border-border group hover:border-primary/30 transition-all">
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                Features
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Professional AI Voice Generation Platform</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Built for professionals who demand quality, speed, and reliability.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Globe,
                  title: "Cross-lingual",
                  desc: "Use the same voice across multiple languages. Switch languages seamlessly while maintaining voice consistency and character."
                },
                {
                  icon: Languages,
                  title: "15+ Languages",
                  desc: "Native-quality voices across English, Spanish, French, German, Japanese, Chinese, and many more languages and dialects."
                },
                {
                  icon: Mic2,
                  title: "Voice Cloning",
                  desc: "Create a clone of your own voice with just a short audio sample. Perfect for brand consistency and personalization."
                },
                {
                  icon: Wand2,
                  title: "Audio Markups",
                  desc: "Add emotion, style, and non-verbal expressions to your voice output. Control tone, pauses, and emphasis for natural delivery."
                },
                {
                  icon: Award,
                  title: "Commercial Rights",
                  desc: "Full commercial licensing included with paid packages. Use generated audio in social media videos and other promotional content which you own."
                },
                {
                  icon: Shield,
                  title: "Privacy Focused",
                  desc: "Your text and audio data are never stored or used for training."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-card/50 dark:bg-black/40 border border-border hover:border-primary/30 transition-colors group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-secondary/10 dark:bg-zinc-900/20 border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                Use Cases
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Suitable For?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">VoiceLo is designed for professionals who need quality voice output.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card/50 dark:bg-black/40 border border-border hover:border-primary/30 transition-all group text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                    <useCase.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              Start with 1,000 Free Credits
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to give your text <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">a professional voice?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose the credit pack that fits your needs. No subscriptions, no hidden fees. Just high-quality AI voices at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {!user && (
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-full bg-secondary/50 hover:bg-secondary text-foreground font-bold text-lg transition-all border border-border flex items-center gap-2"
              >
                View All Pricing Plans
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

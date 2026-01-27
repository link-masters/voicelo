"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Wand2, Loader2, Copy, Check, RotateCcw, Lock, Cpu, Zap, Info, ArrowRight } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";



const OpenAIIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 318 320"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            fill="currentColor"
            d="M297.06 130.97C304.32 109.18 301.82 85.31 290.21 65.49C272.75 35.09 237.65 19.45 203.37 26.81C188.12 9.62999 166.21 -0.140011 143.24 -1.11288e-05C108.2 -0.0800111 77.1101 22.48 66.3301 55.82C43.8201 60.43 24.3901 74.52 13.0201 94.49C-4.56991 124.81 -0.559916 163.03 22.9401 189.03C15.6801 210.82 18.1801 234.69 29.7901 254.51C47.2501 284.91 82.3501 300.55 116.63 293.19C131.87 310.37 153.79 320.14 176.76 319.99C211.82 320.08 242.92 297.5 253.7 264.13C276.21 259.52 295.64 245.43 307.01 225.46C324.58 195.14 320.56 156.95 297.07 130.95L297.06 130.97ZM176.78 299.08C162.75 299.1 149.16 294.19 138.39 285.2C138.88 284.94 139.73 284.47 140.28 284.13L204 247.33C207.26 245.48 209.26 242.01 209.24 238.26V148.43L236.17 163.98C236.46 164.12 236.65 164.4 236.69 164.72V239.11C236.65 272.19 209.86 299.01 176.78 299.08ZM47.9401 244.05C40.9101 231.91 38.3801 217.68 40.7901 203.87C41.2601 204.15 42.0901 204.66 42.6801 205L106.4 241.8C109.63 243.69 113.63 243.69 116.87 241.8L194.66 196.88V227.98C194.68 228.3 194.53 228.61 194.28 228.81L129.87 266C101.18 282.52 64.5401 272.7 47.9501 244.05H47.9401ZM31.1701 104.96C38.1701 92.8 49.2201 83.5 62.3801 78.67C62.3801 79.22 62.3501 80.19 62.3501 80.87V154.48C62.3301 158.22 64.3301 161.69 67.5801 163.54L145.37 208.45L118.44 224C118.17 224.18 117.83 224.21 117.53 224.08L53.1101 186.86C24.4801 170.28 14.6601 133.65 31.1601 104.97L31.1701 104.96ZM252.43 156.45L174.64 111.53L201.57 95.99C201.84 95.81 202.18 95.78 202.48 95.91L266.9 133.1C295.58 149.67 305.41 186.36 288.84 215.04C281.83 227.18 270.79 236.48 257.64 241.32V165.51C257.67 161.77 255.68 158.31 252.44 156.45H252.43ZM279.23 116.11C278.76 115.82 277.93 115.32 277.34 114.98L213.62 78.18C210.39 76.29 206.39 76.29 203.15 78.18L125.36 123.1V92C125.34 91.68 125.49 91.37 125.74 91.17L190.15 54.01C218.84 37.46 255.52 47.31 272.06 76.01C279.05 88.13 281.58 102.32 279.21 116.11H279.23ZM110.72 171.54L83.7801 155.99C83.4901 155.85 83.3001 155.57 83.2601 155.25V80.86C83.2801 47.74 110.15 20.9 143.27 20.92C157.28 20.92 170.84 25.84 181.61 34.8C181.12 35.06 180.28 35.53 179.72 35.87L116 72.67C112.74 74.52 110.74 77.98 110.76 81.73L110.72 171.52V171.54ZM125.35 140L160 119.99L194.65 139.99V180L160 200L125.35 180V140Z"
        />
    </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" />
    </svg>
);

const WRITER_MODELS = [
    {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Optimal for production-ready voice scripts with balanced creativity.",
        icon: <OpenAIIcon className="w-4 h-4" />,
        badge: "Stable",
        brandColor: "bg-white border border-zinc-200 shadow-sm"
    },
    {
        id: "gpt-4.1-nano",
        name: "GPT 4.1 Nano",
        description: "Cutting-edge intelligence for professional-grade creative direction.",
        icon: <OpenAIIcon className="w-4 h-4" />,
        badge: "Stable",
        brandColor: "bg-white border border-zinc-200 shadow-sm"
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Next-gen speed and efficiency for instant script drafts.",
        icon: <GeminiIcon className="w-5 h-5" />,
        badge: "Fast",
        brandColor: "bg-[#1a73e8]"
    },
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "State-of-the-art multimodal intelligence for complex directions.",
        icon: <GeminiIcon className="w-5 h-5" />,
        badge: "GA",
        brandColor: "bg-[#1a73e8]"
    }
];



interface AiWriterToolProps {
    projectId?: string;
}

export default function AiWriterTool({ projectId }: AiWriterToolProps) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const { user, refreshUser } = useAuth();
    const { project, setProject, projects } = useProject();
    const router = useRouter();

    const [prompt, setPrompt] = useState("");
    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedModel, setSelectedModel] = useState(WRITER_MODELS[0].id);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);



    const handleGenerate = async () => {
        if (!prompt.trim() || !user || !project?.$id) return;

        setIsGenerating(true);
        setGeneratedText("");
        setError(null);

        try {
            const response = await fetch('/api/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    userId: user.$id,
                    modelId: selectedModel,
                    projectId: project.$id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to generate text');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Failed to read response stream');
            }

            let accumulatedText = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;
                setGeneratedText(accumulatedText);
            }

            await refreshUser();


        } catch (err: any) {
            console.error('AI Generation failed:', err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUseNow = () => {
        if (!generatedText) return;
        sessionStorage.setItem('pending_tts_text', generatedText);

        if (project?.$id) {
            router.push(`/dashboard/projects/${project.$id}`);
        } else {
            router.push('/dashboard/text-to-speech');
        }
    };



    const isLocked = !project?.$id;

    return (
        <div className="w-full h-full flex flex-col gap-6">

            {/* Content Grid - Following TTSTool proportional layout */}
            <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-6 relative z-10">

                {/* Main Writing Card */}
                <div className="lg:col-span-12 w-full glass-panel rounded-2xl md:rounded-3xl shadow-xl border border-border dark:border-white/5 flex flex-col lg:h-[calc(100vh-140px)] min-h-[600px] relative overflow-hidden">

                    {/* Editor & Controls Split Area */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                        {/* Left: Writing Studio (Prompt Area) */}
                        <div
                            className="flex-1 border-b md:border-b-0 md:border-r border-border dark:border-white/5 relative bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col"
                        >
                            <div className="absolute top-6 left-8 flex items-center gap-3 z-10 select-none pointer-events-none">
                                <div className="flex items-center space-x-2 text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-80">
                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                    <span>Creative Studio</span>
                                </div>
                            </div>

                            <textarea
                                ref={textAreaRef}
                                className="w-full h-full bg-transparent border-none outline-none resize-none text-base md:text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 font-light leading-relaxed scrollbar-hide p-6 md:p-8 pt-16 md:pt-14"
                                placeholder={isLocked ? "Connect a project below to start writing..." : "Your instructions here... e.g. Write a spooky 30-second intro for a horror podcast about abandoned hospitals. Use a lot of vivid imagery."}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLocked || isGenerating}
                                spellCheck={false}
                            />

                            {isLocked && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-50/10 dark:bg-black/10 backdrop-blur-[2px] rounded-3xl">
                                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border dark:border-white/5 flex flex-col items-center gap-2 max-w-xs text-center">
                                        <Lock className="w-8 h-8 text-zinc-400" />
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Project Not Found</p>
                                        <p className="text-xs text-zinc-500">Pick a project and configure the neural engine below to unlock the writer.</p>
                                    </div>
                                </div>
                            )}

                            {/* Character Count like TTS */}
                            <div className="absolute top-6 right-8 text-[10px] font-bold bg-white/90 dark:bg-zinc-800/90 px-3 py-1.5 rounded-xl backdrop-blur-md border border-zinc-200 dark:border-white/10 shadow-lg text-zinc-500 dark:text-zinc-400">
                                {prompt.length.toLocaleString()} Chars
                            </div>
                        </div>

                        {/* Right: Result Sidebar (Neural Content Stream) */}
                        <div className="w-full md:w-[450px] lg:w-[550px] xl:w-[600px] bg-white/90 dark:bg-zinc-950/80 p-0 flex flex-col backdrop-blur-xl border-t md:border-t-0 md:border-l border-border dark:border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-border dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-primary animate-pulse' : 'bg-emerald-500'}`} />
                                    <h3 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                        Generation Output
                                    </h3>
                                </div>

                                {generatedText && (
                                    <div className="flex items-center gap-2">
                                        {!isGenerating && (
                                            <>
                                                <button
                                                    onClick={handleUseNow}
                                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl border border-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group shadow-sm shadow-primary/5"
                                                >
                                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Use Now</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                </button>

                                                <div className="h-8 w-px bg-border dark:bg-white/5 mx-1" />
                                            </>
                                        )}

                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 text-zinc-400 hover:text-primary transition-colors bg-zinc-100 dark:bg-white/5 rounded-lg border border-transparent hover:border-primary/20"
                                            title="Copy Script"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setGeneratedText("");
                                                setPrompt("");
                                            }}
                                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-white/5 rounded-lg border border-transparent hover:border-red-500/20"
                                            title="Clear Editor"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-zinc-50/30 dark:bg-black/20">
                                {generatedText ? (
                                    <div className="space-y-4">
                                        <p className="text-zinc-900 dark:text-zinc-100 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium selectable">
                                            {generatedText}
                                            {isGenerating && <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse rounded-full align-middle" />}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <Wand2 className="w-8 h-8 mb-4 text-zinc-400" />
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Awaiting synthesis...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Configuration Bar (Footer Area - Neural Engine) */}
                    <div className="h-auto border-t border-border dark:border-white/5 bg-white/50 dark:bg-zinc-900/60 p-4 md:p-6 backdrop-blur-md">
                        <div className="max-w-7xl mx-auto flex flex-col gap-3">
                            <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">
                                Choose model
                            </label>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                {/* Neural Engine Models */}
                                <div className="flex-1 w-full md:w-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {WRITER_MODELS.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model.id)}
                                                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${selectedModel === model.id
                                                    ? "bg-white dark:bg-zinc-800 border-primary shadow-lg ring-1 ring-primary/20"
                                                    : "bg-white/50 dark:bg-white/5 border-transparent hover:bg-zinc-100 dark:hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${model.brandColor}`}>
                                                    {React.cloneElement(model.icon as React.ReactElement<any>, {
                                                        className: `${(model.icon as React.ReactElement<any>).props.className} ${model.id.startsWith('gpt') ? 'text-black' : 'text-white'}`
                                                    })}
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-[10px] font-bold ${selectedModel === model.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{model.name}</p>
                                                </div>
                                                {selectedModel === model.id && (
                                                    <Check className="w-3 h-3 text-primary shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pro Tip - Hidden on mobile to save space */}
                                <div className="hidden lg:flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-2xl max-w-xs">
                                    <Info className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                        Specify <span className="text-zinc-900 dark:text-white font-bold">tone</span> and <span className="text-zinc-900 dark:text-white font-bold">length</span> for better results.
                                    </p>
                                </div>

                                {/* Generate Button */}
                                <div className="w-full md:w-auto shrink-0">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!prompt.trim() || isGenerating || isLocked}
                                        className={`w-full md:w-48 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${!prompt.trim() || isGenerating || isLocked
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 shadow-none cursor-not-allowed'
                                            : 'bg-primary text-primary-foreground shadow-primary/25'
                                            }`}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Zap className="w-4 h-4 fill-current" />
                                        )}
                                        <span>{isGenerating ? 'Running' : 'Generate'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(161, 161, 170, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.4);
                }
            `}</style>
        </div>
    );
}

"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Wand2, Loader2, Copy, Check, RotateCcw, Lock, Cpu, Zap, Info } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";



const OpenAIIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 721 721"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M304.246 294.611V249.028C304.246 245.189 305.687 242.309 309.044 240.392L400.692 187.612C413.167 180.415 428.042 177.058 443.394 177.058C500.971 177.058 537.44 221.682 537.44 269.182C537.44 272.54 537.44 276.379 536.959 280.218L441.954 224.558C436.197 221.201 430.437 221.201 424.68 224.558L304.246 294.611ZM518.245 472.145V363.224C518.245 356.505 515.364 351.707 509.608 348.349L389.174 278.296L428.519 255.743C431.877 253.826 434.757 253.826 438.115 255.743L529.762 308.523C556.154 323.879 573.905 356.505 573.905 388.171C573.905 424.636 552.315 458.225 518.245 472.141V472.145ZM275.937 376.182L236.592 353.152C233.235 351.235 231.794 348.354 231.794 344.515V238.956C231.794 187.617 271.139 148.749 324.4 148.749C344.555 148.749 363.264 155.468 379.102 167.463L284.578 222.164C278.822 225.521 275.942 230.319 275.942 237.039V376.186L275.937 376.182ZM360.626 425.122L304.246 393.455V326.283L360.626 294.616L417.002 326.283V393.455L360.626 425.122ZM396.852 570.989C376.698 570.989 357.989 564.27 342.151 552.276L436.674 497.574C442.431 494.217 445.311 489.419 445.311 482.699V343.552L485.138 366.582C488.495 368.499 489.936 371.379 489.936 375.219V480.778C489.936 532.117 450.109 570.985 396.852 570.985V570.989ZM283.134 463.99L191.486 411.211C165.094 395.854 147.343 363.229 147.343 331.562C147.343 294.616 169.415 261.509 203.48 247.593V356.991C203.48 363.71 206.361 368.508 212.117 371.866L332.074 441.437L292.729 463.99C289.372 465.907 286.491 465.907 283.134 463.99ZM277.859 542.68C223.639 542.68 183.813 501.895 183.813 451.514C183.813 447.675 184.294 443.836 184.771 439.997L279.295 494.698C285.051 498.056 290.812 498.056 296.568 494.698L417.002 425.127V470.71C417.002 474.549 415.562 477.429 412.204 479.346L320.557 532.126C308.081 539.323 293.206 542.68 277.854 542.68H277.859ZM396.852 599.776C454.911 599.776 503.37 558.513 514.41 503.812C568.149 489.896 602.696 439.515 602.696 388.176C602.696 354.587 588.303 321.962 562.392 298.45C564.791 288.373 566.231 278.296 566.231 268.224C566.231 199.611 510.571 148.267 446.274 148.267C433.322 148.267 420.846 150.184 408.37 154.505C386.775 133.392 357.026 119.958 324.4 119.958C266.342 119.958 217.883 161.22 206.843 215.921C153.104 229.837 118.557 280.218 118.557 331.557C118.557 365.146 132.95 397.771 158.861 421.283C156.462 431.36 155.022 441.437 155.022 451.51C155.022 520.123 210.682 571.466 274.978 571.466C287.931 571.466 300.407 569.549 312.883 565.228C334.473 586.341 364.222 599.776 396.852 599.776Z" />
    </svg>
);

const GPT_MODELS = [
    {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Optimal for production-ready voice scripts with balanced creativity.",
        icon: <OpenAIIcon className="w-5 h-5" />,
        badge: "Stable"
    },
    {
        id: "gpt-5-nano",
        name: "GPT-5 Nano",
        description: "Cutting-edge intelligence for professional-grade creative direction.",
        icon: <OpenAIIcon className="w-5 h-5" />,
        badge: "Next Gen"
    }
];



interface AiWriterToolProps {
    projectId?: string;
}

export default function AiWriterTool({ projectId }: AiWriterToolProps) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const { user, refreshUser } = useAuth();
    const { project, setProject, projects } = useProject();

    const [prompt, setPrompt] = useState("");
    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedModel, setSelectedModel] = useState(GPT_MODELS[0].id);
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
                            className="flex-1 border-b md:border-b-0 md:border-r border-border dark:border-white/5 relative bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col cursor-text"
                            onClick={() => textAreaRef.current?.focus()}
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
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Writer Context Required</p>
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
                                        Neural Content Stream
                                    </h3>
                                </div>

                                {generatedText && (
                                    <div className="flex items-center gap-2">
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
                                        <p className="text-zinc-900 dark:text-zinc-100 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium">
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
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">

                            {/* Neural Engine Models */}
                            <div className="flex-1 w-full md:w-auto">
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                        <Cpu className="w-3 h-3 mr-2 text-primary" />
                                        Neural Engine
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {GPT_MODELS.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => setSelectedModel(model.id)}
                                                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${selectedModel === model.id
                                                    ? "bg-white dark:bg-zinc-800 border-primary shadow-lg ring-1 ring-primary/20"
                                                    : "bg-white/50 dark:bg-white/5 border-transparent hover:bg-zinc-100 dark:hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className={`p-1 rounded-lg transition-colors ${selectedModel === model.id ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
                                                    {model.icon}
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
                            </div>

                            {/* Pro Tip - Hidden on mobile to save space */}
                            <div className="hidden lg:flex items-start gap-3 p-3 bg-primary/5 border border-primary/10 rounded-2xl max-w-xs">
                                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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

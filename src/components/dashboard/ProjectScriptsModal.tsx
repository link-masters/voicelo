import React, { useState, useEffect } from "react";
import ModalPortal from "./ModalPortal";
import { X, FileText, Search, Loader2, Calendar, Clock, ChevronRight, Sparkles, Check, Upload } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { format } from "date-fns";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = 'ai_history';

interface AiHistoryItem {
    $id: string;
    $createdAt: string;
    prompt: string;
    generatedText: string;
    charCount: number;
    creditCost: number;
}

interface ProjectScriptsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSelect: (text: string) => void;
}

export default function ProjectScriptsModal({ isOpen, onClose, projectId, onSelect }: ProjectScriptsModalProps) {
    const [scripts, setScripts] = useState<AiHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchProjectScripts();
        }
    }, [isOpen, projectId]);

    const fetchProjectScripts = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.equal('projectId', projectId),
                    Query.orderDesc('$createdAt'),
                    Query.limit(50)
                ]
            );
            setScripts(response.documents as unknown as AiHistoryItem[]);
        } catch (error) {
            console.error("Failed to fetch project scripts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredScripts = scripts.filter(item =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generatedText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleLoadSelected = () => {
        if (selectedIds.length === 0) return;

        // Respect the specific order in which items were selected (clicked)
        const selectedTexts = selectedIds
            .map(id => {
                const script = scripts.find(s => s.$id === id);
                return script?.generatedText || "";
            })
            .filter(text => text !== "");

        onSelect(selectedTexts.join("\n\n"));
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto overflow-hidden">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Project Scripts</h2>
                            <p className="text-xs text-zinc-500">Select a script from this project</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-20 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border border-border dark:border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Search */}
                <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-white/5">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search scripts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar-alt min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-zinc-500">Loading scripts...</p>
                        </div>
                    ) : filteredScripts.length > 0 ? (
                        <div className="space-y-4">
                            {filteredScripts.map((item) => (
                                <div
                                    key={item.$id}
                                    onClick={() => toggleSelection(item.$id)}
                                    className={`w-full group relative bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-3xl border transition-all text-left flex flex-col gap-3 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${selectedIds.includes(item.$id)
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                        : 'border-zinc-200 dark:border-white/5 hover:border-primary/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full" >
                                        <div className="flex items-center gap-3" >
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all relative ${selectedIds.includes(item.$id)
                                                ? 'bg-primary border-primary'
                                                : 'border-zinc-300 dark:border-zinc-700'
                                                }`}>
                                                {selectedIds.includes(item.$id) && (
                                                    <span className="text-[10px] text-white font-bold">
                                                        {selectedIds.indexOf(item.$id) + 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(item.$createdAt), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                        <div className="p-1.5 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <h3 className={`font-bold line-clamp-1 leading-tight transition-colors ${selectedIds.includes(item.$id) ? 'text-primary dark:text-primary' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-primary'
                                        }`}>
                                        {item.prompt}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                                        {item.generatedText}
                                    </p>

                                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-200/50 dark:border-white/5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                                            <FileText className="w-3 h-3 text-primary/70" />
                                            {item.charCount} Characters
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-300">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No scripts found</h3>
                            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                                {searchQuery ? "Try a different search term" : "No AI-generated scripts in this project yet."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-4">
                    <div className="flex flex-col items-start gap-1" >
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {selectedIds.length} scripts selected
                        </p>
                        <button
                            onClick={() => setSelectedIds(selectedIds.length === filteredScripts.length ? [] : filteredScripts.map(s => s.$id))}
                            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                        >
                            {selectedIds.length === filteredScripts.length ? "Deselect All" : "Select All Visible"}
                        </button>
                    </div>
                    <button
                        onClick={handleLoadSelected}
                        disabled={selectedIds.length === 0}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${selectedIds.length === 0
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 shadow-none cursor-not-allowed'
                            : 'bg-primary hover:opacity-90 text-white shadow-primary/25 active:scale-95'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        <span>Load Selected Scripts</span>
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar-alt::-webkit-scrollbar {
                    width: 10px;
                }
                .custom-scrollbar-alt::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 20px 4px;
                }
                .custom-scrollbar-alt::-webkit-scrollbar-thumb {
                    background: rgba(161, 161, 170, 0.2);
                    border-radius: 20px;
                    border: 3px solid transparent;
                    background-clip: content-box;
                }
                .custom-scrollbar-alt::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.5);
                    border: 3px solid transparent;
                    background-clip: content-box;
                }
            `}</style>
        </ModalPortal>
    );
}

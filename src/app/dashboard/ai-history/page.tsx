"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Copy, Check, Trash2, Calendar, Clock, CreditCard, ChevronRight, FileText, ExternalLink, Loader2, Sparkles, Folder, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { format } from "date-fns";
import ModalPortal from "@/components/dashboard/ModalPortal";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = 'ai_history';
const PROJECTS_COLLECTION_ID = 'projects';

interface AiHistoryItem {
    $id: string;
    $createdAt: string;
    prompt: string;
    generatedText: string;
    charCount: number;
    creditCost: number;
    projectId?: string;
}

interface ProjectMap {
    [key: string]: string;
}

export default function AiHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<AiHistoryItem[]>([]);
    const [projectMap, setProjectMap] = useState<ProjectMap>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<AiHistoryItem | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<AiHistoryItem | null>(null);

    useEffect(() => {
        if (user) {
            initializeData();
        }
    }, [user]);

    const initializeData = async () => {
        try {
            setLoading(true);
            // Fetch everything in parallel
            await Promise.all([
                fetchProjects(),
                fetchHistory()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_COLLECTION_ID,
                [Query.equal('userId', user!.$id)]
            );
            const mapping: ProjectMap = {};
            response.documents.forEach(doc => {
                mapping[doc.$id] = doc.name;
            });
            setProjectMap(mapping);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.equal('userId', user!.$id),
                    Query.orderDesc('$createdAt'),
                    Query.limit(100)
                ]
            );
            setHistory(response.documents as unknown as AiHistoryItem[]);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const item = history.find(i => i.$id === id);
        if (item) {
            setItemToDelete(item);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(itemToDelete.$id);
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, itemToDelete.$id);
            setHistory(history.filter(item => item.$id !== itemToDelete.$id));
            if (selectedItem?.$id === itemToDelete.$id) setSelectedItem(null);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Failed to delete item:", error);
        } finally {
            setIsDeleting(null);
        }
    };

    const copyToClipboard = (text: string, id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredHistory = history.filter(item =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generatedText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ModalContent = ({ item, onClose }: { item: AiHistoryItem, onClose: () => void }) => (
        <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 pointer-events-auto">
            <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white line-clamp-1">Script Details</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-zinc-500">{format(new Date(item.$createdAt), 'PPP')}</p>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10">
                                <Folder className="w-3 h-3 text-zinc-400" />
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">
                                    {item.projectId ? (projectMap[item.projectId] || 'Unknown Project') : 'No Project'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => copyToClipboard(item.generatedText, item.$id, e)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
                    >
                        {copiedId === item.$id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedId === item.$id ? 'Copied' : 'Copy Script'}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Original Prompt
                    </h3>
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-white/5">
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed italic">
                            "{item.prompt}"
                        </p>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3 text-purple-500" />
                        Generated Script
                    </h3>
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="p-6 bg-white dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-white/5 whitespace-pre-wrap font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-inner">
                            {item.generatedText}
                        </div>
                    </div>
                </section>
            </div>

            <div className="p-6 bg-zinc-50/50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-around text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.$createdAt), 'HH:mm')}
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    {item.charCount} Characters
                </div>
                <div className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    {item.creditCost} Credits
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xl shadow-purple-500/5">
                            <History className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Writing History</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                Managing {history.length} previous AI generations
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                        ))}
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.$id}
                                onClick={() => setSelectedItem(item)}
                                className="group relative bg-white dark:bg-zinc-900/40 p-1 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 hover:border-purple-500/30 transition-all duration-500 cursor-pointer shadow-xl shadow-zinc-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 active:scale-95"
                            >
                                <div className="bg-white dark:bg-zinc-900 rounded-[2.2rem] p-6 h-full flex flex-col items-start gap-4">
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(item.$createdAt), 'MMM d, h:mm a')}
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10 w-fit">
                                                <Folder className="w-2.5 h-2.5 text-zinc-400" />
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate max-w-[100px]">
                                                    {item.projectId ? (projectMap[item.projectId] || 'Unknown') : 'Standalone'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => copyToClipboard(item.generatedText, item.$id, e)}
                                                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-purple-500 transition-all"
                                                title="Copy Text"
                                            >
                                                {copiedId === item.$id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.$id, e)}
                                                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-all"
                                                title="Delete Entry"
                                            >
                                                {isDeleting === item.$id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                                            {item.prompt}
                                        </h3>
                                        <div className="prose dark:prose-invert">
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                                                {item.generatedText}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full pt-4 mt-auto border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-purple-500/10 transition-colors">
                                                <CreditCard className="w-3 h-3 text-purple-500" />
                                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 transition-colors">{item.creditCost}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                                                <FileText className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 transition-colors">{item.charCount}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-300 group-hover:text-purple-500 transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-white/5 text-center transition-all animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                            <History className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Your story starts here</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                            You haven't generated any scripts yet. Start using the AI Writer to see your history appear here!
                        </p>
                        <button
                            onClick={() => window.location.href = '/dashboard/ai-writer'}
                            className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20"
                        >
                            Go to AI Writer
                        </button>
                    </div>
                )}

            </div>

            <ModalPortal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
                {selectedItem && (
                    <ModalContent
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </ModalPortal>

            {/* Delete Confirmation Modal */}
            <ModalPortal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
                    <div className="p-8">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-inner">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                            Delete Script?
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            This action cannot be undone. This script will be permanently removed from your AI writing history.
                        </p>
                    </div>
                    <div className="p-5 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex gap-3 justify-end">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={!!isDeleting}
                            className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={!!isDeleting}
                            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 group active:scale-95"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            Delete Script
                        </button>
                    </div>
                </div>
            </ModalPortal>
        </>
    );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { History, Search, Copy, Check, Trash2, Calendar, Clock, CreditCard, ChevronRight, FileText, ExternalLink, Loader2, Sparkles, Folder, X, AlertTriangle, Edit3, Save, RotateCcw, GitBranch, ChevronDown, Eye, Undo2, MoreHorizontal, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { format, formatDistanceToNow } from "date-fns";
import ModalPortal from "@/components/dashboard/ModalPortal";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = 'ai_history';
const VERSIONS_COLLECTION_ID = 'ai_history_versions';
const PROJECTS_COLLECTION_ID = 'projects';

interface AiHistoryItem {
    $id: string;
    $createdAt: string;
    prompt: string;
    generatedText: string;
    charCount: number;
    creditCost: number;
    projectId?: string;
    title?: string;
    currentVersion?: number;
    lastEditedAt?: string;
}

interface VersionItem {
    $id: string;
    $createdAt: string;
    historyId: string;
    userId: string;
    generatedText: string;
    versionNumber: number;
    charCount: number;
    editNote?: string;
}

interface ProjectMap {
    [key: string]: string;
}

interface ScriptDetailsModalProps {
    item: AiHistoryItem;
    onClose: () => void;
    isEditing: boolean;
    editedTitle: string;
    setEditedTitle: (value: string) => void;
    projectMap: ProjectMap;
    cancelEditing: () => void;
    saveEdit: () => void;
    isSaving: boolean;
    editedText: string;
    setEditedText: (value: string) => void;
    showVersions: boolean;
    toggleVersions: () => void;
    startEditing: () => void;
    copyToClipboard: (text: string, id: string, e?: React.MouseEvent) => void;
    copiedId: string | null;
    editNote: string;
    setEditNote: (value: string) => void;
    versions: VersionItem[];
    loadingVersions: boolean;
    selectedVersion: VersionItem | null;
    setSelectedVersion: (version: VersionItem | null) => void;
    isRestoring: boolean;
    restoreVersion: (version: VersionItem) => void;
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

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState("");
    const [editedTitle, setEditedTitle] = useState("");
    const [editNote, setEditNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Version control states
    const [versions, setVersions] = useState<VersionItem[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (user) {
            initializeData();
        }
    }, [user]);

    const initializeData = async () => {
        try {
            setLoading(true);
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

    const fetchVersions = async (historyId: string) => {
        try {
            setLoadingVersions(true);
            const response = await databases.listDocuments(
                DATABASE_ID,
                VERSIONS_COLLECTION_ID,
                [
                    Query.equal('historyId', historyId),
                    Query.orderDesc('versionNumber'),
                    Query.limit(50)
                ]
            );
            setVersions(response.documents as unknown as VersionItem[]);
        } catch (error) {
            console.error("Failed to fetch versions:", error);
            setVersions([]);
        } finally {
            setLoadingVersions(false);
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

            // Delete all versions first
            const versionsToDelete = await databases.listDocuments(
                DATABASE_ID,
                VERSIONS_COLLECTION_ID,
                [Query.equal('historyId', itemToDelete.$id)]
            );

            await Promise.all(
                versionsToDelete.documents.map(v =>
                    databases.deleteDocument(DATABASE_ID, VERSIONS_COLLECTION_ID, v.$id)
                )
            );

            // Delete the main item
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

    const startEditing = () => {
        if (!selectedItem) return;
        setEditedText(selectedItem.generatedText);
        setEditedTitle(selectedItem.title || selectedItem.prompt.slice(0, 50));
        setEditNote("");
        setIsEditing(true);
        setShowVersions(false);
        setSelectedVersion(null);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedText("");
        setEditedTitle("");
        setEditNote("");
    };

    const saveEdit = async () => {
        if (!selectedItem || !user) return;

        const trimmedText = editedText.trim();
        if (!trimmedText) return;

        // No changes made
        if (trimmedText === selectedItem.generatedText && editedTitle.trim() === (selectedItem.title || selectedItem.prompt.slice(0, 50))) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);

            const newVersion = (selectedItem.currentVersion || 1) + 1;
            const newCharCount = trimmedText.length;
            const now = new Date().toISOString();

            // Save current version to versions collection before updating
            await databases.createDocument(
                DATABASE_ID,
                VERSIONS_COLLECTION_ID,
                ID.unique(),
                {
                    historyId: selectedItem.$id,
                    userId: user.$id,
                    generatedText: selectedItem.generatedText,
                    versionNumber: selectedItem.currentVersion || 1,
                    charCount: selectedItem.charCount,
                    editNote: editNote.trim() || `Version ${selectedItem.currentVersion || 1}`
                }
            );

            // Update the main document
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                selectedItem.$id,
                {
                    generatedText: trimmedText,
                    charCount: newCharCount,
                    currentVersion: newVersion,
                    lastEditedAt: now,
                    title: editedTitle.trim()
                }
            );

            // Update local state
            const updatedItem: AiHistoryItem = {
                ...selectedItem,
                generatedText: trimmedText,
                charCount: newCharCount,
                currentVersion: newVersion,
                lastEditedAt: now,
                title: editedTitle.trim()
            };

            setSelectedItem(updatedItem);
            setHistory(prev => prev.map(item =>
                item.$id === selectedItem.$id ? updatedItem : item
            ));

            setIsEditing(false);
            setEditedText("");
            setEditedTitle("");
            setEditNote("");

            // Refresh versions if panel is open
            if (showVersions) {
                fetchVersions(selectedItem.$id);
            }
        } catch (error) {
            console.error("Failed to save edit:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const restoreVersion = async (version: VersionItem) => {
        if (!selectedItem || !user) return;

        try {
            setIsRestoring(true);

            const newVersionNumber = (selectedItem.currentVersion || 1) + 1;
            const now = new Date().toISOString();

            // Save current state to versions before restoring
            await databases.createDocument(
                DATABASE_ID,
                VERSIONS_COLLECTION_ID,
                ID.unique(),
                {
                    historyId: selectedItem.$id,
                    userId: user.$id,
                    generatedText: selectedItem.generatedText,
                    versionNumber: selectedItem.currentVersion || 1,
                    charCount: selectedItem.charCount,
                    editNote: `Before restoring to v${version.versionNumber}`
                }
            );

            // Update main document with restored version
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                selectedItem.$id,
                {
                    generatedText: version.generatedText,
                    charCount: version.charCount,
                    currentVersion: newVersionNumber,
                    lastEditedAt: now
                }
            );

            // Update local state
            const updatedItem: AiHistoryItem = {
                ...selectedItem,
                generatedText: version.generatedText,
                charCount: version.charCount,
                currentVersion: newVersionNumber,
                lastEditedAt: now
            };

            setSelectedItem(updatedItem);
            setHistory(prev => prev.map(item =>
                item.$id === selectedItem.$id ? updatedItem : item
            ));

            setSelectedVersion(null);

            // Refresh versions
            fetchVersions(selectedItem.$id);
        } catch (error) {
            console.error("Failed to restore version:", error);
        } finally {
            setIsRestoring(false);
        }
    };

    const toggleVersions = () => {
        if (!showVersions && selectedItem) {
            fetchVersions(selectedItem.$id);
        }
        setShowVersions(!showVersions);
        setSelectedVersion(null);
    };

    const openItemDetails = (item: AiHistoryItem) => {
        setSelectedItem(item);
        setIsEditing(false);
        setShowVersions(false);
        setSelectedVersion(null);
        setVersions([]);
    };

    const filteredHistory = history.filter(item =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-200"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
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
                                onClick={() => openItemDetails(item)}
                                className="group relative bg-white dark:bg-zinc-900/40 p-1 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 hover:border-primary/30 transition-all duration-500 cursor-pointer shadow-xl shadow-zinc-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-95"
                            >
                                <div className="bg-white dark:bg-zinc-900 rounded-[2.2rem] p-6 h-full flex flex-col items-start gap-4">
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(item.$createdAt), 'MMM d, h:mm a')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10 w-fit">
                                                    <Folder className="w-2.5 h-2.5 text-zinc-400" />
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate max-w-[80px]">
                                                        {item.projectId ? (projectMap[item.projectId] || 'Unknown') : 'Standalone'}
                                                    </span>
                                                </div>
                                                {item.currentVersion && item.currentVersion > 1 && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                        <GitBranch className="w-2.5 h-2.5 text-emerald-500" />
                                                        <span className="text-[9px] font-bold text-emerald-600">v{item.currentVersion}</span>
                                                    </div>
                                                )}
                                                {item.lastEditedAt && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                                        <Pencil className="w-2.5 h-2.5 text-amber-500" />
                                                        <span className="text-[9px] font-bold text-amber-600">Edited</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => copyToClipboard(item.generatedText, item.$id, e)}
                                                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-primary transition-all"
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
                                            {item.title || item.prompt}
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
                                                <CreditCard className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-primary transition-colors">{item.creditCost}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                                                <FileText className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 transition-colors">{item.charCount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-300 group-hover:text-primary transition-all">
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
                            className="mt-8 px-8 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/25"
                        >
                            Go to AI Writer
                        </button>
                    </div>
                )}

            </div>

            <ModalPortal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
                {selectedItem && (
                    <ScriptDetailsModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        isEditing={isEditing}
                        editedTitle={editedTitle}
                        setEditedTitle={setEditedTitle}
                        projectMap={projectMap}
                        cancelEditing={cancelEditing}
                        saveEdit={saveEdit}
                        isSaving={isSaving}
                        editedText={editedText}
                        setEditedText={setEditedText}
                        showVersions={showVersions}
                        toggleVersions={toggleVersions}
                        startEditing={startEditing}
                        copyToClipboard={copyToClipboard}
                        copiedId={copiedId}
                        editNote={editNote}
                        setEditNote={setEditNote}
                        versions={versions}
                        loadingVersions={loadingVersions}
                        selectedVersion={selectedVersion}
                        setSelectedVersion={setSelectedVersion}
                        isRestoring={isRestoring}
                        restoreVersion={restoreVersion}
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
                            This action cannot be undone. This script and all its version history will be permanently removed.
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

function ScriptDetailsModal({
    item,
    onClose,
    isEditing,
    editedTitle,
    setEditedTitle,
    projectMap,
    cancelEditing,
    saveEdit,
    isSaving,
    editedText,
    setEditedText,
    showVersions,
    toggleVersions,
    startEditing,
    copyToClipboard,
    copiedId,
    editNote,
    setEditNote,
    versions,
    loadingVersions,
    selectedVersion,
    setSelectedVersion,
    isRestoring,
    restoreVersion
}: ScriptDetailsModalProps) {
    return (
        <div className={`relative w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 flex max-h-[90vh] animate-in zoom-in-95 duration-300 pointer-events-auto transition-all ${showVersions ? 'max-w-6xl' : 'max-w-4xl'}`}>
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-20 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border border-border dark:border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/5 flex items-end justify-between bg-zinc-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner flex-shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    className="text-xl font-bold text-zinc-900 dark:text-white bg-transparent border-b-2 border-primary focus:outline-none w-full"
                                    maxLength={256}
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white line-clamp-1">
                                    {item.title || "Script Details"}
                                </h2>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-xs text-zinc-500">{format(new Date(item.$createdAt), 'PPP')}</p>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10">
                                    <Folder className="w-3 h-3 text-zinc-400" />
                                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">
                                        {item.projectId ? (projectMap[item.projectId] || 'Unknown Project') : 'No Project'}
                                    </span>
                                </div>
                                {item.currentVersion && item.currentVersion > 1 && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <GitBranch className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                v{item.currentVersion}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-12 flex-shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-bold"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={saveEdit}
                                    disabled={isSaving || !editedText.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>Save Changes</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleVersions}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${showVersions
                                        ? 'bg-violet-500/10 text-violet-600 border-violet-500/30'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-transparent hover:bg-violet-500/10 hover:text-violet-600'
                                        }`}
                                >
                                    <GitBranch className="w-4 h-4" />
                                    <span>Versions</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showVersions ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-600 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all border border-transparent"
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={(e) => copyToClipboard(item.generatedText, item.$id, e)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 border border-primary"
                                >
                                    {copiedId === item.$id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{copiedId === item.$id ? 'Copied' : 'Copy'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    {isEditing && (
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Edit3 className="w-3 h-3 text-amber-500" />
                                Edit Note (Optional)
                            </h3>
                            <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Describe your changes..."
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-zinc-400"
                                maxLength={256}
                            />
                        </section>
                    )}

                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-primary" />
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
                            <FileText className="w-3 h-3 text-primary" />
                            {isEditing ? 'Edit Script' : 'Generated Script'}
                            {item.lastEditedAt && !isEditing && (
                                <span className="ml-2 text-[10px] font-medium text-zinc-400 normal-case tracking-normal">
                                    (Last edited {formatDistanceToNow(new Date(item.lastEditedAt))} ago)
                                </span>
                            )}
                        </h3>
                        <div className="prose dark:prose-invert max-w-none">
                            {isEditing ? (
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full min-h-[300px] p-6 bg-white dark:bg-zinc-950/50 rounded-3xl border-2 border-amber-500/30 focus:border-amber-500 focus:outline-none font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed resize-y transition-colors"
                                    placeholder="Edit your script..."
                                />
                            ) : (
                                <div className="p-6 bg-white dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-white/5 whitespace-pre-wrap font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-inner">
                                    {item.generatedText}
                                </div>
                            )}
                        </div>
                        {isEditing && (
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span>{editedText.length.toLocaleString()} characters</span>
                                <span className={editedText.length !== item.charCount ? 'text-amber-500 font-medium' : ''}>
                                    {editedText.length - item.charCount > 0 ? '+' : ''}{(editedText.length - item.charCount).toLocaleString()} from original
                                </span>
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-zinc-50/50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-around text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.$createdAt), 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {item.charCount.toLocaleString()} Characters
                    </div>
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        {item.creditCost} Credits
                    </div>
                </div>
            </div>

            {/* Version History Panel */}
            {showVersions && (
                <div className="w-80 border-l border-zinc-100 dark:border-white/5 flex flex-col bg-zinc-50/50 dark:bg-black/20 flex-shrink-0">
                    <div className="p-5 border-b border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <GitBranch className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white">Version History</h3>
                                <p className="text-xs text-zinc-500">{versions.length} previous versions</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingVersions ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                    <History className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">No previous versions</p>
                                <p className="text-xs text-zinc-400 mt-1">Edit the script to create versions</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-2">
                                {/* Current Version */}
                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-emerald-500/30 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Current</span>
                                        <span className="text-xs font-bold text-zinc-400">v{item.currentVersion || 1}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-2">{item.generatedText.slice(0, 100)}...</p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                                        <FileText className="w-3 h-3" />
                                        {item.charCount.toLocaleString()} chars
                                    </div>
                                </div>

                                {/* Previous Versions */}
                                {versions.map((version) => (
                                    <div
                                        key={version.$id}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedVersion?.$id === version.$id
                                            ? 'bg-violet-500/10 border-violet-500/30'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 hover:border-violet-500/30'
                                            }`}
                                        onClick={() => setSelectedVersion(selectedVersion?.$id === version.$id ? null : version)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                                Version {version.versionNumber}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                {formatDistanceToNow(new Date(version.$createdAt))} ago
                                            </span>
                                        </div>
                                        {version.editNote && (
                                            <p className="text-[11px] text-violet-600 font-medium mb-2 italic">
                                                "{version.editNote}"
                                            </p>
                                        )}
                                        <p className="text-xs text-zinc-500 line-clamp-2">{version.generatedText.slice(0, 100)}...</p>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                                            <FileText className="w-3 h-3" />
                                            {version.charCount.toLocaleString()} chars
                                        </div>

                                        {selectedVersion?.$id === version.$id && (
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-violet-500/20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(version.generatedText, version.$id);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                                                >
                                                    {copiedId === version.$id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {copiedId === version.$id ? 'Copied' : 'Copy'}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        restoreVersion(version);
                                                    }}
                                                    disabled={isRestoring}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 rounded-lg text-xs font-bold text-white transition-colors"
                                                >
                                                    {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                                                    Restore
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

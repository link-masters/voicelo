"use client";

import React, { useState, useEffect } from "react";
import { X, GripVertical, Play, Pause, Loader2, Download, CheckCircle2, Music, PlusCircle, Trash2 } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useNotifications } from "@/context/NotificationContext";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModalPortal from "./ModalPortal";

interface AudioItem {
    id: string;
    text: string;
    voiceName: string;
    audioContent: string;
    timestamp: string;
    settings: {
        rate: number;
        pitch: number;
    };
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

function SortableAudioItem({ item, index, onPlay, isPlaying, onRemove }: {
    item: AudioItem;
    index: number;
    onPlay: (item: AudioItem) => void;
    isPlaying: boolean;
    onRemove: (item: AudioItem) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-white/5 rounded-2xl transition-all ${isDragging ? 'shadow-2xl ring-2 ring-primary/50' : 'shadow-sm'
                } pointer-events-auto`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="pt-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-primary transition-colors"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Order Number */}
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary shrink-0 font-bold text-sm">
                {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                            {item.voiceName}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {item.timestamp}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPlay(item)}
                            className={`p-2 rounded-lg transition-all shrink-0 ${isPlaying
                                ? 'bg-primary/20 text-primary'
                                : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-primary'
                                }`}
                            title={isPlaying ? "Stop" : "Play Preview"}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                            ) : (
                                <Play className="w-4 h-4 fill-current" />
                            )}
                        </button>
                        <button
                            onClick={() => onRemove(item)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                            title="Sidelined (Exclude from export)"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic leading-relaxed">
                    "{item.text}"
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>Speed: {item.settings.rate}x</span>
                    <span>•</span>
                    <span>Pitch: {item.settings.pitch}</span>
                </div>
            </div>
        </div>
    );
}

export default function ExportModal({ isOpen, onClose, projectId, projectName }: ExportModalProps) {
    const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
    const [excludedItems, setExcludedItems] = useState<AudioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { addNotification } = useNotifications();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            fetchAudioItems();
        } else {
            setExcludedItems([]);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [isOpen]);

    const fetchAudioItems = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'generations',
                [
                    Query.equal('projectId', projectId),
                    Query.orderDesc('$createdAt'),
                    Query.limit(100)
                ]
            );

            const items: AudioItem[] = response.documents
                .filter((doc: any) => doc.audioContent)
                .map((doc: any) => ({
                    id: doc.$id,
                    text: doc.text,
                    voiceName: doc.voiceName,
                    audioContent: doc.audioContent,
                    timestamp: new Date(doc.$createdAt).toLocaleString(),
                    settings: JSON.parse(doc.settings || '{"rate":1,"pitch":1}')
                }));

            setAudioItems(items);
        } catch (error) {
            console.error("Failed to fetch audio items:", error);
            addNotification({
                title: "Error",
                message: "Failed to load project audio files.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setAudioItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handlePlayItem = (item: AudioItem) => {
        if (playingId === item.id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }

        try {
            const binaryString = window.atob(item.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setPlayingId(null);
            audio.play();
            setPlayingId(item.id);
        } catch (error) {
            console.error("Playback error:", error);
            addNotification({
                title: "Playback Failed",
                message: "Unable to play audio preview.",
                type: "error"
            });
        }
    };

    const handleExcludeItem = (item: AudioItem) => {
        setAudioItems(prev => prev.filter(i => i.id !== item.id));
        setExcludedItems(prev => [item, ...prev]);
    };

    const handleRestoreItem = (item: AudioItem) => {
        setExcludedItems(prev => prev.filter(i => i.id !== item.id));
        setAudioItems(prev => [...prev, item]);
    };

    const handleExport = async () => {
        if (audioItems.length === 0) {
            addNotification({
                title: "No Audio",
                message: "Please generate some audio first.",
                type: "warning"
            });
            return;
        }

        try {
            setExporting(true);
            const response = await fetch('/api/export-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioItems: audioItems.map(item => item.audioContent),
                    projectName: projectName
                })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_export_${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addNotification({
                title: "Export Successful",
                message: `${audioItems.length} audio files merged successfully!`,
                type: "success"
            });

            onClose();
        } catch (error) {
            console.error("Export error:", error);
            addNotification({
                title: "Export Failed",
                message: "Failed to merge audio files. Please try again.",
                type: "error"
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-full max-h-[92vh] flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="relative p-6 border-b border-border dark:border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4 pr-12">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-4 ring-primary/5">
                            <Music className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                                Export Project Audio
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Drag and drop to reorder. The files will be merged in the order shown below.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading audio files...</p>
                        </div>
                    ) : (audioItems.length === 0 && excludedItems.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                <Music className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                No Audio Files
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                                Generate some audio in this project first to export.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={audioItems.map(item => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {audioItems.map((item, index) => (
                                            <SortableAudioItem
                                                key={item.id}
                                                item={item}
                                                index={index}
                                                onPlay={handlePlayItem}
                                                isPlaying={playingId === item.id}
                                                onRemove={handleExcludeItem}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {excludedItems.length > 0 && (
                                <div className="mt-12 space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5"></div>
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Inactive Audio ({excludedItems.length})
                                        </h3>
                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5"></div>
                                    </div>
                                    <div className="space-y-3 opacity-60">
                                        {excludedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl grayscale transition-all hover:grayscale-0 hover:opacity-100"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 shrink-0 font-bold text-sm italic">
                                                    -
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                        {item.voiceName}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-400 truncate">
                                                        {item.text}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handlePlayItem(item)}
                                                        className={`p-2 rounded-lg transition-all shrink-0 ${playingId === item.id
                                                            ? 'bg-primary/20 text-primary'
                                                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-primary'
                                                            }`}
                                                    >
                                                        {playingId === item.id ? (
                                                            <Pause className="w-4 h-4 fill-current" />
                                                        ) : (
                                                            <Play className="w-4 h-4 fill-current" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreItem(item)}
                                                        className="p-2 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                                                        title="Restore to export list"
                                                    >
                                                        <PlusCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(audioItems.length > 0 || excludedItems.length > 0) && (
                    <div className="p-6 border-t border-border dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={exporting}
                                className="flex-1 px-5 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting || audioItems.length === 0}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Merging Audio...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Export & Download
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ModalPortal>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { X, FolderOpen, AlertCircle, Plus, ChevronRight } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalPortal from "./ModalPortal";

interface Project {
    $id: string;
    name: string;
    description?: string;
    $createdAt: string;
}

interface ProjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceId: string;
    voiceName: string;
}

export default function ProjectSelectionModal({ isOpen, onClose, voiceId, voiceName }: ProjectSelectionModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            fetchProjects();
        }
    }, [isOpen, user]);

    const fetchProjects = async () => {
        if (!user?.$id) return;

        try {
            setLoading(true);
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

            const response = await databases.listDocuments(
                DATABASE_ID,
                'projects',
                [
                    Query.equal('userId', user.$id),
                    Query.orderDesc('$createdAt'),
                    Query.limit(100)
                ]
            );

            setProjects(response.documents as unknown as Project[]);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectSelect = (projectId: string) => {
        router.push(`/dashboard/projects/${projectId}?voice=${voiceId}`);
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
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
                            <FolderOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                                Select a Project
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Choose where you want to use <span className="font-semibold text-primary">{voiceName}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading your projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                <FolderOpen className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                No Projects Yet
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
                                Create your first project to start organizing your voice generations and use this voice.
                            </p>
                            <Link
                                href="/dashboard/projects"
                                onClick={onClose}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-bold uppercase tracking-wide transition-all border border-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                Create First Project
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Info Banner */}
                            <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl mb-4">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                    <span className="font-bold">Pro Tip:</span> Organizing generations in projects helps you keep track of your work and manage your audio library efficiently.
                                </p>
                            </div>

                            {/* Project List */}
                            {projects.map((project) => (
                                <button
                                    key={project.$id}
                                    onClick={() => handleProjectSelect(project.$id)}
                                    className="w-full group flex items-center justify-between p-4 bg-white dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/30 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-md dark:shadow-none"
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                            <FolderOpen className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1 truncate group-hover:text-primary transition-colors">
                                                {project.name}
                                            </h3>
                                            {project.description && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                    {project.description}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                                                Created {new Date(project.$createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                </button>
                            ))}

                            {/* Create New Project Link */}
                            <Link
                                href="/dashboard/projects"
                                onClick={onClose}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl transition-all text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Project
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button
                        onClick={onClose}
                        className="w-full px-5 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                        Cancel
                    </button>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-3">
                        Select a project above to use this voice
                    </p>
                </div>
            </div>
        </ModalPortal>
    );
}

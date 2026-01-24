"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { databases, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { Query } from 'appwrite';
import { Folder, Plus, Calendar, Trash2, Loader2, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import ModalPortal from './ModalPortal';

interface Project {
    $id: string;
    name: string;
    description?: string;
    $createdAt: string;
}

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROJECTS_COLLECTION_ID = 'projects';

export default function ProjectsList() {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_COLLECTION_ID,
                [
                    Query.equal('userId', user!.$id),
                    Query.orderDesc('$createdAt')
                ]
            );
            setProjects(response.documents as unknown as Project[]);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        if (newProjectName.length > 50) {
            addNotification({
                title: "Error",
                message: "Project name is too long (max 50 characters).",
                type: "error"
            });
            return;
        }

        try {
            setCreating(true);
            await databases.createDocument(
                DATABASE_ID,
                PROJECTS_COLLECTION_ID,
                ID.unique(),
                {
                    name: newProjectName,
                    description: newProjectDesc.trim() || "VoiceLo project",
                    userId: user!.$id
                }
            );

            addNotification({
                title: "Project Created",
                message: "Your new project is ready.",
                type: "success"
            });

            setIsCreateModalOpen(false);
            setNewProjectName('');
            setNewProjectDesc('');
            fetchProjects();
        } catch (error) {
            console.error('Failed to create project:', error);
            addNotification({
                title: "Error",
                message: "Failed to create project. Please try again.",
                type: "error"
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault(); // Prevent navigation
        setProjectToDelete(projectId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setDeleting(true);

        try {
            // 1. Delete associated generations first
            let hasMoreGenerations = true;
            while (hasMoreGenerations) {
                const generations = await databases.listDocuments(
                    DATABASE_ID,
                    'generations',
                    [
                        Query.equal('projectId', projectToDelete),
                        Query.limit(25) // Process in chunks
                    ]
                );

                if (generations.documents.length === 0) {
                    hasMoreGenerations = false;
                } else {
                    await Promise.all(
                        generations.documents.map(doc =>
                            databases.deleteDocument(DATABASE_ID, 'generations', doc.$id)
                        )
                    );
                }
            }

            // 2. Delete the project document
            await databases.deleteDocument(
                DATABASE_ID,
                PROJECTS_COLLECTION_ID,
                projectToDelete
            );
            setProjects(prev => prev.filter(p => p.$id !== projectToDelete));
            addNotification({
                title: "Project Deleted",
                message: "The project has been removed.",
                type: "success"
            });
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error('Failed to delete project:', error);
            addNotification({
                title: "Error",
                message: "Failed to delete project.",
                type: "error"
            });
        } finally {
            setDeleting(false);
        }
    };

    if (loading && projects.length === 0) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">My Projects</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your text-to-speech generations</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="
                        group relative flex items-center gap-2 px-5 py-2.5 
                        bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 
                        rounded-full font-semibold shadow-lg shadow-zinc-500/20 dark:shadow-white/10 
                        hover:shadow-xl hover:shadow-zinc-500/30 dark:hover:shadow-white/20 
                        hover:-translate-y-0.5 transition-all duration-300
                    "
                >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    <span>New Project</span>
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            href={`/dashboard/projects/${project.$id}`}
                            key={project.$id}
                            className="group relative bg-white dark:bg-zinc-900 border border-border dark:border-white/5 rounded-2xl p-6 hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Folder className="w-6 h-6 fill-current" />
                                </div>
                                <div className="">
                                    <button
                                        onClick={(e) => handleDeleteProject(e, project.$id)}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 flex-1">
                                {project.description || "No description provided."}
                            </p>

                            <div className="pt-4 border-t border-border dark:border-white/5 flex items-center justify-between text-xs text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(project.$createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-primary font-medium transition-opacity">
                                    Open Project <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                        <Folder className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No projects yet</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
                        Create your first project to start organizing your generations.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="
                            group relative flex items-center gap-2 px-6 py-3 
                            bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 
                            rounded-full font-semibold shadow-lg shadow-zinc-500/20 dark:shadow-white/10 
                            hover:shadow-xl hover:shadow-zinc-500/30 dark:hover:shadow-white/20 
                            hover:-translate-y-0.5 transition-all duration-300
                        "
                    >
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        <span>Create Project</span>
                    </button>
                </div>
            )}

            {/* Create Project Modal */}
            <ModalPortal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
                    <div className="p-6 border-b border-border dark:border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create New Project</h2>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="p-1 px-2.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. Marketing Video, Podcast Intro"
                                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                autoFocus
                                required
                                maxLength={50}
                            />
                            <div className="flex justify-end">
                                <span className={`text-[10px] font-medium ${newProjectName.length >= 50 ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {newProjectName.length}/50 characters
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</label>
                            <textarea
                                value={newProjectDesc}
                                onChange={(e) => setNewProjectDesc(e.target.value)}
                                placeholder="Brief description of your project..."
                                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none h-24"
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !newProjectName.trim()}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            </ModalPortal>

            {/* Delete Confirmation Modal */}
            <ModalPortal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                            Delete "{projects.find(p => p.$id === projectToDelete)?.name}"?
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            This action cannot be undone. All generations and data associated with this project will be permanently deleted.
                        </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-border dark:border-white/5 flex gap-3 justify-end">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteProject}
                            disabled={deleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                        >
                            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Delete Project
                        </button>
                    </div>
                </div>
            </ModalPortal>
        </div>
    );
}

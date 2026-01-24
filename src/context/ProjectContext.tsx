"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROJECTS_COLLECTION_ID = 'projects';

interface Project {
    $id: string;
    name: string;
    description?: string;
    [key: string]: any;
}

interface ProjectContextType {
    project: Project | null;
    projects: Project[];
    loadingProjects: boolean;
    setProject: (project: Project | null) => void;
    refreshProjects: (userId: string) => Promise<void>;
    attemptNavigation: (href: string) => void;
    cancelNavigation: () => void;
    confirmNavigation: () => void;
    isNavigationModalOpen: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [project, setProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const refreshProjects = async (userId: string) => {
        try {
            setLoadingProjects(true);
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_COLLECTION_ID,
                [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
            );

            const fetchedProjects = response.documents as unknown as Project[];
            setProjects(fetchedProjects);

            // Auto-select first project if none selected
            if (!project && fetchedProjects.length > 0) {
                setProject(fetchedProjects[0]);
            }
        } catch (error) {
            console.error('Failed to refresh projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const attemptNavigation = (href: string) => {
        if (project && pathname?.includes("/dashboard/projects/")) {
            setPendingUrl(href);
            setIsNavigationModalOpen(true);
        } else {
            router.push(href);
        }
    };

    const confirmNavigation = () => {
        if (pendingUrl) {
            setProject(null); // Close project specific UI
            router.push(pendingUrl);
            setIsNavigationModalOpen(false);
            setPendingUrl(null);
        }
    };

    const cancelNavigation = () => {
        setIsNavigationModalOpen(false);
        setPendingUrl(null);
    };

    return (
        <ProjectContext.Provider value={{
            project,
            projects,
            loadingProjects,
            setProject,
            refreshProjects,
            attemptNavigation,
            cancelNavigation,
            confirmNavigation,
            isNavigationModalOpen
        }}>
            {children}
            {isNavigationModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Leave Project?</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                You are about to leave the project view. Any unsaved changes might be lost. Are you sure you want to exit?
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-border dark:border-white/5 flex gap-3 justify-end">
                            <button
                                onClick={cancelNavigation}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmNavigation}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all"
                            >
                                Leave Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
